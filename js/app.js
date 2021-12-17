import * as THREE from "../build/three.module.js";
import fragment from "./shader/fragment.js";
import vertex from "./shader/vertex.js";
import { OrbitControls } from './../jsm/controls/OrbitControls.js';

let sphere360Origin = '../assets/pano0.png';
let sphere360Destination = '../assets/pano1.png';

export default class Sketch {
  constructor(options) {
    this.scene360Destination = new THREE.Scene();
    this.scene360Origin = new THREE.Scene();
    this.sceneFinal = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1); 

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    var frustumSize = 1;
    this.cameraFinal = new THREE.OrthographicCamera( frustumSize / - 2, frustumSize / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(-2, 0, 0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;
    
    this.create360Origin();
    this.create360Destination();
    this.createFinalScene();
    this.resize();
    this.render();
    this.setupResize();
    this.settings();
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  create360Origin() {
    this.geometry = new THREE.SphereBufferGeometry(10, 30, 30);

    let t = new THREE.TextureLoader().load(sphere360Origin);
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
    this.sphere = new THREE.Mesh(this.geometry, 
      new THREE.MeshBasicMaterial({
        map: t,
        side: THREE.BackSide
      })
      );
    this.scene360Origin.add(this.sphere);
  }

  create360Destination() {
    this.geometry = new THREE.SphereBufferGeometry(10, 30, 30);

    let t = new THREE.TextureLoader().load(sphere360Destination);
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
    this.sphere = new THREE.Mesh(this.geometry, 
      new THREE.MeshBasicMaterial({
        map: t,
        side: THREE.BackSide
      })
      );
    this.scene360Destination.add(this.sphere);
  }

  createFinalScene() {
    this.texture360Destination = new THREE.WebGLRenderTarget(this.width, this.height, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });

    this.texture360Origin = new THREE.WebGLRenderTarget(this.width, this.height, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        progress: { value: 0 },
        scene360Origin: { value: null },
        scene360Destination: { value: null }
      },
      vertexShader: vertex,
      fragmentShader: fragment
    });

    let geo = new THREE.PlaneBufferGeometry(1, 1);
    let mesh = new THREE.Mesh(geo, this.material);
    this.sceneFinal.add(mesh);

  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;

    requestAnimationFrame(this.render.bind(this));
    this.renderer.setRenderTarget(this.texture360Destination);
    this.renderer.render(this.scene360Destination, this.camera);

    this.renderer.setRenderTarget(this.texture360Origin);
    this.renderer.render(this.scene360Origin, this.camera);
    this.material.uniforms.scene360Destination.value = this.texture360Destination.texture;
    this.material.uniforms.scene360Origin.value = this.texture360Origin.texture;
    this.material.uniforms.progress.value = this.settings.progress;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.sceneFinal, this.cameraFinal);
  }
}

new Sketch({
  dom: document.getElementById("container")
});
