/* ============================================================
   SPARSH HQ v3 — boot.js (ES module)
   Loads modern Three.js + its official addons and exposes them
   on window.THREE for the classic scripts that follow.
   ============================================================ */
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { VignetteShader } from "three/addons/shaders/VignetteShader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

window.THREE = Object.assign({}, T, {
  GLTFLoader, RoomEnvironment, EffectComposer, RenderPass, ShaderPass,
  UnrealBloomPass, OutputPass, GTAOPass, SMAAPass, VignetteShader,
  RoundedBoxGeometry, SkeletonUtils,
});
