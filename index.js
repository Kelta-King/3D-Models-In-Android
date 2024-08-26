import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
        const scene = new BABYLON.Scene(engine);

        const camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 4, 4, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);

        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), scene);

        // Load the GLTF model
        BABYLON.SceneLoader.ImportMesh('', './path/to/your/', 'model.gltf', scene, (meshes) => {
            meshes.forEach((mesh) => {
                console.log('Mesh name:', mesh.name);
                mesh.position.y = 1;
            });
        });

        return scene;
    };

    const scene = createScene();

    engine.runRenderLoop(() => {
        scene.render();
    });

    window.addEventListener('resize', () => {
        engine.resize();
    });
});
