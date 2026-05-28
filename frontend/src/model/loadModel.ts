import type { ModelMeta } from './buildPointwiseRows'

export interface CtrMeanHistory {
  sum: number
  count: number
}

export interface CtrValueTable {
  index_hash_viewer: Record<string, number>
  target_classes_count: number
  counter_denominator: number
  ctr_mean_history: CtrMeanHistory[]
  ctr_total: number[]
}

export interface ModelCtr {
  base_hash: string | number
  base_ctr_type: string
  target_border_idx: number
  prior_num: number
  prior_denom: number
  shift: number
  scale: number
}

export interface CompressedModelCtr {
  projection: {
    transposed_cat_feature_indexes: number[]
    binarized_indexes: Array<{ bin_index: number; check_value_equal: boolean | number; value: number }>
  }
  model_ctrs: ModelCtr[]
}

export interface RuntimeModel {
  float_features_index: number[]
  float_feature_count: number
  cat_feature_count: number
  binary_feature_count: number
  tree_count: number
  float_feature_borders: number[][]
  tree_depth: number[]
  tree_split_border: number[]
  tree_split_feature_index: number[]
  tree_split_xor_mask: number[]
  cat_features_index: number[]
  one_hot_cat_feature_index: number[]
  one_hot_hash_values: number[][]
  ctr_feature_borders: number[][]
  leaf_values: number[][]
  scale: number
  biases: number[]
  dimension: number
  model_ctrs: {
    used_model_ctrs_count: number
    compressed_model_ctrs: CompressedModelCtr[]
    ctr_data: { learn_ctrs: Record<string, CtrValueTable> }
  } | null
}

export interface LoadedModel {
  meta: ModelMeta
  runtime: RuntimeModel
  catFeatureHashes: Record<string, number>
}

let cachedModel: LoadedModel | null = null

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`)
  return (await response.json()) as T
}

export async function initModel(): Promise<LoadedModel> {
  if (cachedModel) return cachedModel
  const [meta, runtime, catFeatureHashes] = await Promise.all([
    fetchJson<ModelMeta>('/model/catboost_model.json'),
    fetchJson<RuntimeModel>('/model/catboost_web_runtime.json'),
    fetchJson<Record<string, number>>('/model/catboost_cat_features_hashes.json'),
  ])
  cachedModel = { meta, runtime, catFeatureHashes }
  return cachedModel
}

export function getLoadedModel(): LoadedModel {
  if (!cachedModel) {
    throw new Error('Model is not initialized')
  }
  return cachedModel
}

export function resetLoadedModelForTests(): void {
  cachedModel = null
}
