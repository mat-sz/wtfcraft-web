import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { GridMaterial } from '@babylonjs/materials/grid';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import '@babylonjs/core/Meshes/meshBuilder';

import './App.scss';
import { terrain } from './utils/terrain';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

const engine = new Engine(canvas);
const scene = new Scene(engine);

const material = new GridMaterial('grid', scene);

const camera = new FreeCamera('playerCamera', new Vector3(0, 1, 0), scene);
camera.setTarget(Vector3.Zero());

const playerBox = Mesh.CreateBox('player', 1, scene);
playerBox.position = new Vector3(10.5, 34.5, 10.5);
playerBox.material = material;

camera.parent = playerBox;

const light = new HemisphericLight('light1', new Vector3(0, 35, 0), scene);
light.intensity = 10;

const map = new Array(32)
  .fill(undefined)
  .map((_, x) =>
    new Array(32)
      .fill(undefined)
      .map((_, y) =>
        new Array(32)
          .fill(undefined)
          .map((_, z) => terrain(1234, x, y, z) > 0.1)
      )
  );

const points: number[] = [];
const indices: number[] = [];
const normals: number[] = [];
let index = 0;

enum FaceType {
  TOP,
  BOTTOM,
  FRONT,
  BACK,
  LEFT,
  RIGHT,
}

function face(x: number, y: number, z: number, type: FaceType) {
  switch (type) {
    case FaceType.TOP:
      points.push(
        x,
        y + 1,
        z,
        x,
        y + 1,
        z + 1,
        x + 1,
        y + 1,
        z,
        x + 1,
        y + 1,
        z,
        x,
        y + 1,
        z + 1,
        x + 1,
        y + 1,
        z + 1
      );
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
      break;
    case FaceType.BOTTOM:
      points.push(
        x,
        y,
        z,
        x,
        y,
        z + 1,
        x + 1,
        y,
        z,
        x + 1,
        y,
        z,
        x,
        y,
        z + 1,
        x + 1,
        y,
        z + 1
      );
      normals.push(0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0);
      break;
    case FaceType.LEFT:
      points.push(
        x,
        y,
        z,
        x,
        y,
        z + 1,
        x,
        y + 1,
        z,
        x,
        y + 1,
        z,
        x,
        y,
        z + 1,
        x,
        y + 1,
        z + 1
      );
      normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0);
      break;
    case FaceType.RIGHT:
      points.push(
        x + 1,
        y,
        z,
        x + 1,
        y,
        z + 1,
        x + 1,
        y + 1,
        z,
        x + 1,
        y + 1,
        z,
        x + 1,
        y,
        z + 1,
        x + 1,
        y + 1,
        z + 1
      );
      normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
      break;
    case FaceType.BACK:
      points.push(
        x,
        y,
        z,
        x + 1,
        y,
        z,
        x,
        y + 1,
        z,
        x,
        y + 1,
        z,
        x + 1,
        y,
        z,
        x + 1,
        y + 1,
        z
      );
      normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
      break;
    case FaceType.FRONT:
      points.push(
        x,
        y,
        z + 1,
        x + 1,
        y,
        z + 1,
        x,
        y + 1,
        z + 1,
        x,
        y + 1,
        z + 1,
        x + 1,
        y,
        z + 1,
        x + 1,
        y + 1,
        z + 1
      );
      normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
      break;
  }

  if (
    type === FaceType.TOP ||
    type === FaceType.FRONT ||
    type === FaceType.LEFT
  ) {
    for (let i = 5; i >= 0; i--) {
      indices.push(index + i);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      indices.push(index + i);
    }
  }
  index += 6;
}

function checkAndPaint(x: number, y: number, z: number, type: FaceType) {
  let val: boolean;
  switch (type) {
    case FaceType.TOP:
      val = map[x]?.[y + 1]?.[z];
      break;
    case FaceType.BOTTOM:
      val = map[x]?.[y - 1]?.[z];
      break;
    case FaceType.LEFT:
      val = map[x - 1]?.[y]?.[z];
      break;
    case FaceType.RIGHT:
      val = map[x + 1]?.[y]?.[z];
      break;
    case FaceType.BACK:
      val = map[x]?.[y]?.[z - 1];
      break;
    case FaceType.FRONT:
      val = map[x]?.[y]?.[z + 1];
      break;
  }
  if (!val) {
    face(x, y, z, type);
  }
}

for (let x = 0; x < 32; x++) {
  for (let y = 0; y < 32; y++) {
    for (let z = 0; z < 32; z++) {
      const p = map[x][y][z];
      if (p) {
        checkAndPaint(x, y, z, FaceType.TOP);
        checkAndPaint(x, y, z, FaceType.BOTTOM);
        checkAndPaint(x, y, z, FaceType.LEFT);
        checkAndPaint(x, y, z, FaceType.RIGHT);
        checkAndPaint(x, y, z, FaceType.BACK);
        checkAndPaint(x, y, z, FaceType.FRONT);
      }
    }
  }
}

const customMesh = new Mesh('block', scene);
customMesh.material = material;
const vertexData = new VertexData();
vertexData.positions = points;
vertexData.indices = indices;
vertexData.normals = normals;
vertexData.applyToMesh(customMesh);

const playerVector = new Vector3(0, 0, 0);
let playerMoveLeft = false;
let playerMoveRight = false;
let playerMoveForwards = false;
let playerMoveBackwards = false;

scene.beforeRender = () => {
  let { x, y, z } = playerBox.position;
  x -= 0.5;
  y -= 0.5;
  z -= 0.5;

  let angle = 0;
  let speed = 0;

  if (
    playerMoveLeft ||
    playerMoveRight ||
    playerMoveForwards ||
    playerMoveBackwards
  ) {
    speed = 2;
  }

  if (
    !(playerMoveForwards || playerMoveBackwards) &&
    (playerMoveLeft || playerMoveRight)
  ) {
    angle = camera.rotation.y + ((playerMoveLeft ? -1 : 1) * Math.PI) / 2;
  } else if (
    (playerMoveForwards || playerMoveBackwards) &&
    !(playerMoveLeft || playerMoveRight)
  ) {
    angle = camera.rotation.y + (playerMoveForwards ? 0 : Math.PI);
  } else {
    angle =
      camera.rotation.y +
      (playerMoveForwards ? 0 : Math.PI) +
      ((playerMoveLeft === playerMoveForwards ? -1 : 1) * Math.PI) / 4;
  }

  const increaseX =
    (Math.sin(angle) * speed + playerVector.x) * (engine.getDeltaTime() / 1000);
  const increaseZ =
    (Math.cos(angle) * speed + playerVector.z) * (engine.getDeltaTime() / 1000);
  const blockAheadLowerBody =
    map[Math.floor(x + increaseX * 10)]?.[Math.floor(y)]?.[
      Math.floor(z + increaseZ * 10)
    ];
  const blockAheadUpperBody =
    map[Math.floor(x + increaseX * 10)]?.[Math.floor(y + 1)]?.[
      Math.floor(z + increaseZ * 10)
    ];
  if (!blockAheadLowerBody && !blockAheadUpperBody) {
    playerBox.position.x += increaseX;
    playerBox.position.z += increaseZ;
  }

  playerBox.position.y += playerVector.y * (engine.getDeltaTime() / 1000);

  const blockBelow =
    map[Math.floor(x + 0.5)]?.[Math.floor(y - 0.1)]?.[Math.floor(z + 0.5)];
  if (blockBelow && y - Math.floor(y) < 0.2 && playerVector.y < 0) {
    playerBox.position.y = Math.floor(y) + 0.5;
    playerVector.y = 0;
  } else {
    playerVector.y -= (engine.getDeltaTime() / 1000) * 9.81;
  }
};

canvas.addEventListener('click', () => {
  canvas.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas) {
    document.addEventListener('mousemove', updatePosition, false);
  } else {
    document.removeEventListener('mousemove', updatePosition, false);
  }
});

function updatePosition(e: MouseEvent) {
  const yawChange = e.movementX / canvas.width;
  const pitchChange = e.movementY / canvas.width;
  camera.rotation.y += yawChange;
  camera.rotation.x += pitchChange;

  if (camera.rotation.x <= -Math.PI / 2)
    camera.rotation.x = -Math.PI / 2 + 0.01;
  if (camera.rotation.x >= Math.PI / 2) camera.rotation.x = Math.PI / 2 - 0.01;
}

document.addEventListener('keydown', e => {
  e.preventDefault();

  switch (e.key) {
    case ' ':
      if (playerVector.y >= 0 && playerVector.y <= 0.2) {
        playerVector.y += 6;
      }
      break;
    case 'w':
      playerMoveForwards = true;
      break;
    case 's':
      playerMoveBackwards = true;
      break;
    case 'a':
      playerMoveLeft = true;
      break;
    case 'd':
      playerMoveRight = true;
      break;
  }
});

document.addEventListener('keypress', e => {
  e.preventDefault();

  switch (e.key) {
    case ' ':
      if (playerVector.y <= 0.5) {
        playerVector.y += 6;
      }
      break;
  }
});

document.addEventListener('keyup', e => {
  e.preventDefault();

  switch (e.key) {
    case 'w':
      playerMoveForwards = false;
      break;
    case 's':
      playerMoveBackwards = false;
      break;
    case 'a':
      playerMoveLeft = false;
      break;
    case 'd':
      playerMoveRight = false;
      break;
  }
});

engine.runRenderLoop(() => {
  scene.render();
});
