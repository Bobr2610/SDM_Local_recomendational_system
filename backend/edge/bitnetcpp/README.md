# bitnet.cpp (Android build helper)

This folder contains helper scripts to fetch and build bitnet.cpp for Android.

## Fetch source

```
./fetch_bitnetcpp.ps1
```

## Build (NDK required)

Set environment variables:

- `ANDROID_NDK_ROOT`
- `ANDROID_ABI` (e.g. `arm64-v8a`)
- `ANDROID_PLATFORM` (e.g. `android-26`)

Then run:

```
./build_android.ps1
```

Artifacts will be placed under `build-android/`.
