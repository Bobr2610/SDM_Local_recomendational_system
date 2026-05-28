import type { PointwiseRow } from './buildPointwiseRows'
import type { LoadedModel, ModelCtr, RuntimeModel } from './loadModel'

const MAX_UINT64 = 0xffff_ffff_ffff_ffffn
const MAGIC_MULT = 0x4906ba494954cb65n
const DEFAULT_CAT_HASH = 0x7fff_ffff

function hashString(hashMap: Record<string, number>, value: string): number {
  return hashMap[String(value)] ?? DEFAULT_CAT_HASH
}

function calcHash(a: bigint, b: bigint): bigint {
  return (MAGIC_MULT * ((a + MAGIC_MULT * b) & MAX_UINT64)) & MAX_UINT64
}

function calcModelCtr(ctr: ModelCtr, countInClass: number, totalCount: number): number {
  const raw = (countInClass + ctr.prior_num) / (totalCount + ctr.prior_denom)
  return (raw + ctr.shift) * ctr.scale
}

function calcProjectionHash(
  binaryFeatures: number[],
  hashedCatFeatures: number[],
  projection: Projection,
): string {
  let result = 0n
  for (const catFeatureIndex of projection.transposed_cat_feature_indexes) {
    result = calcHash(result, BigInt.asUintN(64, BigInt(hashedCatFeatures[catFeatureIndex] ?? 0)))
  }
  for (const binFeatureIndex of projection.binarized_indexes) {
    const binaryFeature = binaryFeatures[binFeatureIndex.bin_index] ?? 0
      const isEqualCheck = Boolean(binFeatureIndex.check_value_equal)
      const value = !isEqualCheck
        ? (binaryFeature >= binFeatureIndex.value ? 1n : 0n)
        : (binaryFeature === binFeatureIndex.value ? 1n : 0n)
    result = calcHash(result, value)
  }
  return result.toString()
}

function fillCtrs(model: LoadedModel, binaryFeatures: number[], hashedCatFeatures: number[]): number[] {
  const ctrContainer = model.runtime.model_ctrs
  if (!ctrContainer || ctrContainer.used_model_ctrs_count === 0) return []

  const result = new Array<number>(ctrContainer.used_model_ctrs_count).fill(0)
  let resultIndex = 0

  for (const compressedCtr of ctrContainer.compressed_model_ctrs) {
    const ctrHash = calcProjectionHash(binaryFeatures, hashedCatFeatures, compressedCtr.projection)
    for (const ctr of compressedCtr.model_ctrs) {
      const learnCtr = ctrContainer.ctr_data.learn_ctrs[String(ctr.base_hash)]
      const bucket = learnCtr?.index_hash_viewer?.[ctrHash]
      if (bucket == null) {
        result[resultIndex] = calcModelCtr(ctr, 0, 0)
        resultIndex += 1
        continue
      }

      if (ctr.base_ctr_type === 'BinarizedTargetMeanValue' || ctr.base_ctr_type === 'FloatTargetMeanValue') {
        const meanHistory = learnCtr.ctr_mean_history[bucket]
        result[resultIndex] = calcModelCtr(ctr, meanHistory.sum, meanHistory.count)
      } else if (ctr.base_ctr_type === 'Counter' || ctr.base_ctr_type === 'FeatureFreq') {
        result[resultIndex] = calcModelCtr(ctr, learnCtr.ctr_total[bucket], learnCtr.counter_denominator)
      } else if (ctr.base_ctr_type === 'Buckets') {
        const offset = bucket * learnCtr.target_classes_count
        let totalCount = 0
        for (let classId = 0; classId < learnCtr.target_classes_count; classId += 1) {
          totalCount += learnCtr.ctr_total[offset + classId]
        }
        const goodCount = learnCtr.ctr_total[offset + ctr.target_border_idx]
        result[resultIndex] = calcModelCtr(ctr, goodCount, totalCount)
      } else if (learnCtr.target_classes_count > 2) {
        const offset = bucket * learnCtr.target_classes_count
        let goodCount = 0
        let totalCount = 0
        for (let classId = 0; classId <= ctr.target_border_idx; classId += 1) {
          totalCount += learnCtr.ctr_total[offset + classId]
        }
        for (let classId = ctr.target_border_idx + 1; classId < learnCtr.target_classes_count; classId += 1) {
          goodCount += learnCtr.ctr_total[offset + classId]
        }
        totalCount += goodCount
        result[resultIndex] = calcModelCtr(ctr, goodCount, totalCount)
      } else {
        const offset = bucket * 2
        result[resultIndex] = calcModelCtr(
          ctr,
          learnCtr.ctr_total[offset + 1],
          learnCtr.ctr_total[offset] + learnCtr.ctr_total[offset + 1],
        )
      }
      resultIndex += 1
    }
  }

  return result
}

function buildBinaryFeatures(model: LoadedModel, row: PointwiseRow): number[] {
  const runtime = model.runtime
  const binaryFeatures = new Array<number>(runtime.binary_feature_count).fill(0)
  let binaryFeatureIndex = 0

  for (let featureIndex = 0; featureIndex < runtime.float_feature_borders.length; featureIndex += 1) {
    const borders = runtime.float_feature_borders[featureIndex]
    for (const border of borders) {
      binaryFeatures[binaryFeatureIndex] += row.numeric[runtime.float_features_index[featureIndex]] > border ? 1 : 0
    }
    binaryFeatureIndex += 1
  }

  const hashedCatFeatures = row.categorical.map((value) => hashString(model.catFeatureHashes, value))
  if (runtime.one_hot_cat_feature_index.length > 0) {
    const packedIndexes = new Map<number, number>()
    runtime.cat_features_index.forEach((catFeatureIndex, packedIndex) => {
      packedIndexes.set(catFeatureIndex, packedIndex)
    })

    for (let i = 0; i < runtime.one_hot_cat_feature_index.length; i += 1) {
      const packedIndex = packedIndexes.get(runtime.one_hot_cat_feature_index[i])
      if (packedIndex == null) continue
      const hash = hashedCatFeatures[packedIndex]
      for (let borderIndex = 0; borderIndex < runtime.one_hot_hash_values[i].length; borderIndex += 1) {
        if (hash === runtime.one_hot_hash_values[i][borderIndex]) {
          binaryFeatures[binaryFeatureIndex] |= borderIndex + 1
        }
      }
      binaryFeatureIndex += 1
    }
  }

  const ctrs = fillCtrs(model, binaryFeatures, hashedCatFeatures)
  for (let i = 0; i < runtime.ctr_feature_borders.length; i += 1) {
    for (const border of runtime.ctr_feature_borders[i]) {
      binaryFeatures[binaryFeatureIndex] += ctrs[i] > border ? 1 : 0
    }
    binaryFeatureIndex += 1
  }

  return binaryFeatures
}

export function predictRow(model: LoadedModel, row: PointwiseRow): number {
  const runtime = model.runtime
  const binaryFeatures = buildBinaryFeatures(model, row)
  let treeSplitsIndex = 0
  let leafValueIndex = 0
  let result = 0

  for (let treeId = 0; treeId < runtime.tree_count; treeId += 1) {
    const currentTreeDepth = runtime.tree_depth[treeId]
    let index = 0
    for (let depth = 0; depth < currentTreeDepth; depth += 1) {
      const border = runtime.tree_split_border[treeSplitsIndex + depth]
      const featureIndex = runtime.tree_split_feature_index[treeSplitsIndex + depth]
      const xorMask = runtime.tree_split_xor_mask[treeSplitsIndex + depth]
      index |= (((binaryFeatures[featureIndex] ?? 0) ^ xorMask) >= border ? 1 : 0) << depth
    }
    result += runtime.leaf_values[leafValueIndex + index][0]
    treeSplitsIndex += currentTreeDepth
    leafValueIndex += 1 << currentTreeDepth
  }

  return runtime.scale * result + runtime.biases[0]
}

export function predictRows(model: LoadedModel, rows: PointwiseRow[]): number[] {
  return rows.map((row) => predictRow(model, row))
}
type Projection = NonNullable<RuntimeModel['model_ctrs']>['compressed_model_ctrs'][number]['projection']
