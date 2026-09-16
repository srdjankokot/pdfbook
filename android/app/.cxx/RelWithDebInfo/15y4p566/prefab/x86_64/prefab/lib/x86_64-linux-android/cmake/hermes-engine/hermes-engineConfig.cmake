if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/srdjankokot/.gradle/caches/9.4.1/transforms/4b1201a8cff028773266549fc58b8a24/transformed/hermes-android-250829098.0.17-release/prefab/modules/hermesvm/libs/android.x86_64/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/srdjankokot/.gradle/caches/9.4.1/transforms/4b1201a8cff028773266549fc58b8a24/transformed/hermes-android-250829098.0.17-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

