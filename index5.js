var canvas = document.getElementById("renderCanvas");

var startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
}

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function () {
    return new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false
    });
};

function handleLongPress(element, callback) {
    let timer;

    const startPress = (event) => {
        if (event.touches && event.touches.length > 1) return; // Only single point click allowed

        timer = setTimeout(() => {
            callback(event);
        }, 3000); // 3 seconds
    };

    const cancelPress = () => {
        clearTimeout(timer);
    };

    element.addEventListener('mousedown', startPress);
    element.addEventListener('touchstart', startPress);

    element.addEventListener('mouseup', cancelPress);
    element.addEventListener('mouseleave', cancelPress);
    element.addEventListener('touchend', cancelPress);
    element.addEventListener('touchcancel', cancelPress);
}

function createLabel(str) {
    let lbl = document.createElement('div');
    lbl.style.userSelect = "none";
    lbl.style.top = '0px';
    lbl.style.left = '0px';
    lbl.style.position = "absolute";
    lbl.style.backgroundColor = "red";
    lbl.style.resize = "both";
    lbl.style.padding = "5px 30px 5px 30px";
    lbl.style.maxWidth = "180px";
    lbl.style.width = "180px";
    lbl.style.height = 'auto';
    lbl.style.display = "flex wrap";
    lbl.style.justifyContent = "center";
    lbl.style.alignSelf = "flex-end";
    lbl.style.textAlign = "center";
    let p = document.createElement('p')
    lbl.appendChild(p)
    p.textContent = str;
    canvasZone.appendChild(lbl)
    return lbl;
}

var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    var canvasZone = document.getElementById('canvasZone');

    //Adding a light
    var light = new BABYLON.HemisphericLight("Hemi", new BABYLON.Vector3(0, 1, 0), scene);

    //Adding an Arc Rotate Camera
    var camera = new BABYLON.ArcRotateCamera("Camera", -1.85, 1.2, 200, BABYLON.Vector3.Zero(), scene);

    camera.attachControl(canvas, true);
    var all_labels = [];
    var sprites = [];

    sprites.forEach((sprite) => {
        sprite.elem.style.position = 'absolute';
        sprite.elem.style.width = sprite.width + 'px';
        sprite.elem.style.height = sprite.height + 'px';
        sprite.elem.style.backgroundColor = sprite.color;
        sprite.elem.style.top = '0px';
        sprite.elem.style.left = '0px';

        canvasZone.appendChild(sprite.elem);
    });



    BABYLON.SceneLoader.ImportMesh("", "http://localhost:8080/ThreeJs/NPM/Models/", "BusterDrone.gltf",
        scene,
        function (newMeshes) {
            var cat = newMeshes[0];
            // console.log(cat);
            // stopAllAnimations(cat);

            // Set the target of the camera to the first imported mesh
            camera.target = cat;
            var onPointerDown = function (evt) {
                console.log(evt);
                if (evt.button !== 0) {
                    console.log("Return");
                    return;
                }

                // check if we are under a mesh
                // var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh === cat; });
                var pickInfo = scene.pickWithRay(scene.createPickingRay(scene.pointerX, scene
                    .pointerY, BABYLON.Matrix.Identity(), camera));

                if (pickInfo.hit) {

                    // add a sprite
                    let sprite = {
                        pos: pickInfo.pickedPoint,
                        elem: document.createElement('div'),
                        color: '#00ff00',
                        width: 80,
                        height: 80
                    }
                    sprite.pos.addInPlace(pickInfo.getNormal());

                    sprite.elem.style.position = 'absolute';
                    sprite.elem.style.width = sprite.width + 'px';
                    sprite.elem.style.height = sprite.height + 'px';
                    sprite.elem.style.backgroundColor = sprite.color;
                    sprite.elem.style.top = '0px';
                    sprite.elem.style.left = '0px';
                    sprites.push(sprite);

                    console.log("Appending");
                    canvasZone.appendChild(sprite.elem);
                }
            }

            var canvas = engine.getRenderingCanvas();
            handleLongPress(canvas, function (event) {
                console.log(event);
            })
            canvas.addEventListener('touchstart', function (evt) {
                console.log(evt);
            });
            canvas.addEventListener("pointerdown", onPointerDown, false);
            canvas.addEventListener("pointerup", onPointerUp, false);
            var renderer = scene.enableDepthRenderer(camera, false);
            var depthMap = renderer.getDepthMap();
            var buffer = new Float32Array(4 * depthMap.getSize().width * depthMap.getSize().height);
            scene.onDispose = function () {
                canvas.removeEventListener("pointerdown", onPointerDown);
                all_labels.forEach((ob) => {
                    ob.div.remove()
                })

                sprites.forEach((ob) => {
                    ob.elem.remove()
                })
                all_labels = null
            }


            scene.onAfterRenderObservable.add(() => {

                depthMap.readPixels(0, 0, buffer);

                sprites.forEach((sprite) => {
                    var posInView = BABYLON.Vector3.TransformCoordinates(sprite.pos,
                        scene.getViewMatrix());
                    var posInViewProj = BABYLON.Vector3.TransformCoordinates(sprite.pos,
                        scene.getTransformMatrix());
                    var screenCoords = posInViewProj.multiplyByFloats(0.5, -0.5, 1.0)
                        .add(new BABYLON.Vector3(0.5, 0.5, 0.0)).
                    multiplyByFloats(engine.getRenderWidth(), engine.getRenderHeight(),
                        1);

                    var px = screenCoords.x - sprite.width / 2;
                    var py = screenCoords.y - sprite.height / 2;

                    sprite.elem.style.left = (px + canvasZone.offsetLeft) + 'px';
                    sprite.elem.style.top = (py + canvasZone.offsetTop) + 'px';

                    px = Math.floor(px + sprite.width / 2);
                    py = Math.floor(engine.getRenderHeight() - (py + sprite.height /
                        2));

                    var zInZBuff = buffer[4 * (px + py * depthMap.getSize().width)];

                    var z = (posInView.z - camera.minZ) / (-camera.minZ + camera.maxZ);

                    if (z > zInZBuff) {
                        sprite.elem.style.opacity = 0.0;
                    } else {
                        sprite.elem.style.opacity = 1.0;
                    }
                });
            });

        });
    return scene;
};
window.initFunction = async function () {

    var asyncEngineCreation = async function () {
        try {
            return createDefaultEngine();
        } catch (e) {
            console.log(
                "the available createEngine function failed. Creating the default engine instead"
            );
            return createDefaultEngine();
        }
    }

    window.engine = await asyncEngineCreation();
    if (!engine) throw 'engine should not be null.';
    startRenderLoop(engine, canvas);
    window.scene = createScene();
    scene.animationGroups.forEach(group => {
        group.dispose();
    });
};

initFunction()
    .then(() => {
        sceneToRender = scene;
    });

// Resize
window.addEventListener("resize", function () {
    engine.resize();

});