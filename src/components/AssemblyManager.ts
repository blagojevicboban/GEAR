// @ts-ignore
import { TransformControls } from '../lib/TransformControls.js';

// We need to extend the Window interface to include AFRAME
declare global {
    interface Window {
        AFRAME: any;
        THREE: any;
    }
}

const AFRAME = typeof window !== 'undefined' ? window.AFRAME : null;
const THREE =
    typeof window !== 'undefined'
        ? window.THREE || (AFRAME ? AFRAME.THREE : null)
        : null;

if (AFRAME && THREE) {
    // --- System: Assembly Mode Manager ---
    if (!AFRAME.systems['assembly-mode-system']) {
        AFRAME.registerSystem('assembly-mode-system', {
            schema: {
                enabled: { default: false },
                snapThreshold: { default: 0.15 }, // Distance in meters to snap
                snapAngleThreshold: { default: 0.2 }, // Radians (approx 11 degrees)
            },

            init: function () {
                this.selectedObject = null;
                this.originalTransforms = new Map(); // uuid -> { position, quaternion }
                this.transformControls = null;
                this.ghostObject = null;

                // Bind methods
                this.onSelect = this.onSelect.bind(this);
                this.onTransformChange = this.onTransformChange.bind(this);
                this.onMouseUp = this.onMouseUp.bind(this);

                // Create global TransformControls
                this.setupControls();
            },

            setupControls: function () {
                const scene = this.el.sceneEl.object3D;
                const camera = this.el.sceneEl.camera;
                const renderer = this.el.sceneEl.renderer;

                if (!renderer || !camera) {
                    // If scene not fully loaded, retry shortly
                    setTimeout(() => this.setupControls(), 500);
                    return;
                }

                this.transformControls = new TransformControls(
                    camera,
                    renderer.domElement
                );
                this.transformControls.addEventListener(
                    'change',
                    this.onTransformChange
                );
                this.transformControls.addEventListener(
                    'dragging-changed',
                    (event: any) => {
                        // Disable orbit controls while dragging
                        const orbitControls =
                            this.el.sceneEl.querySelector('[look-controls]')
                                ?.components['look-controls'];
                        if (orbitControls) orbitControls.enabled = !event.value;

                        if (!event.value) {
                            this.onMouseUp();
                        }
                    }
                );

                scene.add(this.transformControls);
                this.transformControls.visible = false;
                this.transformControls.enabled = false;

                // Fix for A-Frame: manual update need possibly?
                // Usually A-Frame render loop handles it, but TransformControls is outside A-Frame entity system slightly
            },

            update: function (oldData: any) {
                if (this.data.enabled !== oldData.enabled) {
                    if (!this.data.enabled) {
                        this.deselect();
                    }
                }
            },

            registerPart: function (mesh: any) {
                if (!this.originalTransforms.has(mesh.uuid)) {
                    // Store WORLD transform because parts might be nested in complex ways
                    // But for simple translation/rotation restoration, local might be safer if hierarchy is stable.
                    // Let's store LOCAL for now, assuming parts are direct children of the model entity or their parents don't move.
                    // Actually, glTF parts are often deeply nested.
                    // If we move the part securely, we are modifying its local matrix.

                    this.originalTransforms.set(mesh.uuid, {
                        position: mesh.position.clone(),
                        quaternion: mesh.quaternion.clone(),
                        scale: mesh.scale.clone(),
                    });

                    // Mark as interactable for raycaster
                    mesh.userData.isAssemblyPart = true;
                }
            },

            registerAllParts: function () {
                const modelEl = document.querySelector('.interactable-model');
                if (modelEl) {
                    (modelEl as any).object3D.traverse((node: any) => {
                        if (node.isMesh) {
                            this.registerPart(node);
                        }
                    });
                }
            },

            onSelect: function (object: any) {
                if (!this.data.enabled) return;
                if (this.selectedObject === object) return;

                this.deselect();
                this.selectedObject = object;

                // Attach controls
                if (this.transformControls) {
                    this.transformControls.attach(object as any);
                    this.transformControls.visible = true;
                    this.transformControls.enabled = true;
                }

                // Show Ghost
                this.createGhost(object);

                // Highlight effect (optional)
                if (object.material && object.material.emissive) {
                    object.currentHex = object.material.emissive.getHex();
                    object.material.emissive.setHex(0x444444);
                }
            },

            deselect: function () {
                if (!this.selectedObject) return;

                const obj = this.selectedObject;

                // Restore highlight
                if (obj.material && obj.material.emissive) {
                    if (obj.currentHex !== undefined)
                        obj.material.emissive.setHex(obj.currentHex);
                    else obj.material.emissive.setHex(0x000000);
                }

                if (this.transformControls) {
                    this.transformControls.detach();
                    this.transformControls.visible = false;
                    this.transformControls.enabled = false;
                }

                this.removeGhost();
                this.selectedObject = null;
            },

            createGhost: function (object: any) {
                if (this.ghostObject) this.removeGhost();

                const originalData = this.originalTransforms.get(object.uuid);
                if (!originalData) return;

                // Clone the geometry to create a ghost helper
                const ghostGeo = object.geometry.clone();
                const ghostMat = new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.3,
                    wireframe: true,
                });

                this.ghostObject = new THREE.Mesh(ghostGeo, ghostMat);

                // Position ghost at ORIGINAL local transform relative to the same parent
                this.ghostObject.position.copy(originalData.position);
                this.ghostObject.quaternion.copy(originalData.quaternion);
                this.ghostObject.scale.copy(originalData.scale);

                if (object.parent) {
                    object.parent.add(this.ghostObject);
                }
            },

            removeGhost: function () {
                if (this.ghostObject) {
                    if (this.ghostObject.parent)
                        this.ghostObject.parent.remove(this.ghostObject);
                    this.ghostObject.geometry.dispose();
                    this.ghostObject.material.dispose();
                    this.ghostObject = null;
                }
            },

            onTransformChange: function () {
                // Check snap distance
                if (!this.selectedObject || !this.ghostObject) return;

                const posDist = this.selectedObject.position.distanceTo(
                    this.ghostObject.position
                );

                // Visual feedback if close (e.g. Ghost turns solid green)
                if (posDist < this.data.snapThreshold) {
                    this.ghostObject.material.opacity = 0.8;
                    this.ghostObject.material.color.setHex(0x00ff00);
                } else {
                    this.ghostObject.material.opacity = 0.3;
                    this.ghostObject.material.color.setHex(0xffff00);
                }
            },

            onMouseUp: function () {
                if (!this.selectedObject || !this.ghostObject) return;

                const posDist = this.selectedObject.position.distanceTo(
                    this.ghostObject.position
                );

                if (posDist < this.data.snapThreshold) {
                    // SNAP!
                    const original = this.originalTransforms.get(
                        this.selectedObject.uuid
                    );
                    if (original) {
                        this.selectedObject.position.copy(original.position);
                        this.selectedObject.quaternion.copy(
                            original.quaternion
                        );
                        this.selectedObject.scale.copy(original.scale);

                        // Flash confirmation?
                        this.deselect();
                    }
                }
            },

            resetAll: function () {
                this.deselect();
                this.originalTransforms.forEach((data: any, uuid: string) => {
                    const modelEl = document.querySelector('.interactable-model');
                    if (modelEl) {
                        (modelEl as any).object3D.traverse((node: any) => {
                            if (node.isMesh && node.uuid === uuid) {
                                node.position.copy(data.position);
                                node.quaternion.copy(data.quaternion);
                                node.scale.copy(data.scale);
                            }
                        });
                    }
                });
            },

            explode: function (scale: number = 1.5) {
                this.deselect();
                // 1. Calculate Center of Mass (of original positions)
                const center = new THREE.Vector3();
                let count = 0;
                this.originalTransforms.forEach((data: any) => {
                    center.add(data.position);
                    count++;
                });
                if (count > 0) center.divideScalar(count);

                // 2. Animate parts
                const modelEl = document.querySelector('.interactable-model');
                if (!modelEl) return;

                const duration = 1000; // ms
                const startTime = Date.now();

                 // Store target positions
                const targets = new Map();
                this.originalTransforms.forEach((data: any, uuid: string) => {
                    const direction = new THREE.Vector3().subVectors(data.position, center);
                    // If direction is near zero (part is at center), push it up or random
                    if (direction.lengthSq() < 0.001) direction.set(0, 1, 0);
                    
                    const targetPos = new THREE.Vector3().copy(data.position).add(direction.multiplyScalar(scale));
                    targets.set(uuid, targetPos);
                });

                const animate = () => {
                    const now = Date.now();
                    const progress = Math.min((now - startTime) / duration, 1);
                    // Ease out quadratic
                    const ease = progress * (2 - progress);

                    (modelEl as any).object3D.traverse((node: any) => {
                        if (node.isMesh && this.originalTransforms.has(node.uuid)) {
                            const original = this.originalTransforms.get(node.uuid);
                            const target = targets.get(node.uuid);
                            if (target) {
                                node.position.lerpVectors(original.position, target, ease);
                            }
                        }
                    });

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            },

            collapse: function () {
                this.deselect();
                 const modelEl = document.querySelector('.interactable-model');
                if (!modelEl) return;

                const duration = 1000;
                const startTime = Date.now();

                // Current positions are start, originals are target
                // We need to capture current positions because they might be mid-move or manually moved?
                // Actually, let's just lerp from wherever they are to original.
                
                const startPositions = new Map();
                (modelEl as any).object3D.traverse((node: any) => {
                     if (node.isMesh && this.originalTransforms.has(node.uuid)) {
                         startPositions.set(node.uuid, node.position.clone());
                     }
                });

                const animate = () => {
                    const now = Date.now();
                    const progress = Math.min((now - startTime) / duration, 1);
                     const ease = progress * (2 - progress);

                    (modelEl as any).object3D.traverse((node: any) => {
                        if (node.isMesh && this.originalTransforms.has(node.uuid)) {
                            const start = startPositions.get(node.uuid);
                            const original = this.originalTransforms.get(node.uuid);
                            if (start && original) {
                                node.position.lerpVectors(start, original.position, ease);
                                // Also restore rotation/scale just in case
                                if (progress === 1) {
                                     node.quaternion.copy(original.quaternion);
                                     node.scale.copy(original.scale);
                                }
                            }
                        }
                    });

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            }
        });
    }

    // --- Component: Interactive Part ---
    if (!AFRAME.components['interactive-part']) {
        AFRAME.registerComponent('interactive-part', {
            init: function () {
                this.system = this.el.sceneEl.systems['assembly-mode-system'];
            },

            events: {
                click: function (this: any, evt: any) {
                    // Stop propagation if we handled it
                    if (!this.system.data.enabled) return;

                    // We need to know WHICH mesh was clicked.
                    // A-Frame click event on entity usually bubbles.
                    // But here we are adding this component to... wait.
                    // We will add this component to the MODEL entity, but it needs to handle clicks on children.

                    // Actually, simpler approach:
                    // The raycaster intersects objects.
                    // A-Frame provides `evt.detail.intersection.object`.

                    const intersection = evt.detail.intersection;
                    if (intersection && intersection.object) {
                        // Only interact if it's a registered part (has original transform)
                        if (intersection.object.userData.isAssemblyPart) {
                            (this as any).system.onSelect(intersection.object);
                            evt.stopPropagation(); // Prevent hitting other things
                        }
                    }
                },
            },
        });
    }
}

export default 'AssemblyManagerLoaded';
