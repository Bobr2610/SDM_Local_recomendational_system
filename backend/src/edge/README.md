# Edge Runtime (Android)

This folder describes the on-device runtime and local personalization.

## Goals

- Server trains and ships base BitNet model.
- Device runs inference and **only local** personalization.
- No user data sync back to server.

## Local data layout (device)

```
/app_files/sdm/
  model/
    bitnet_recommender.gguf
    bitnet_recommender.onnx
    model_meta.json
    feature_order.json
  user/
    <user_id>/
      click_history.json
      personalization.json
      profile.json
```

## Personalization algorithm

Local online updates learn a per-user bias vector over products:

- Start with zeros.
- On each click: increase bias for clicked product and decrease a few sampled negatives.
- Bias is applied to base model scores at inference time.

This is simple, stable, and does not leak data to the server.

## Modules

- `runtime/inference.py` - Python emulator of Android runtime.
- `personalization/online_bias.py` - Online bias updates.
- `personalization/storage.py` - Local JSON persistence.

## Export to Android assets

```
python backend/scripts/export_to_android.py
```

This copies model artifacts from `backend/models/export/` to `backend/edge/android_assets/`.

## bitnet.cpp integration (Android)

Use the GGUF model with a native runtime. Suggested structure:

```
android/app/src/main/cpp/bitnetcpp/   # bitnet.cpp source
android/app/src/main/cpp/native/      # JNI wrapper
android/app/src/main/assets/model/    # gguf + meta
```

Build steps depend on your Android project setup and NDK toolchain.
