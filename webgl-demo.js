
var cubeRotation = 0.0;
var cubeRotationX = -10.0;
var cubeRotationY = 0.0;
var wind = vec3.fromValues(0.0,0.0,0.0);
var usePhysics = false;
var rightPressed = false;
var leftPressed = false;
var upPressed = false;
var downPressed = false;
var sPressed = false;
var xPressed = false;
var cPressed = false;
var tPressed = false;
var Keys = { left: 37, up: 38, right: 39, down: 40 , s: 83, x: 88, c: 67, t: 84};

//Objects and additional info about current object
const objects = [new ParticleMesh('objekti/teapot.obj'), new ParticleMesh('objekti/sheet_small.obj'),  new ParticleMesh('objekti/sheet_large.obj'), new ParticleMesh('objekti/sheet_detailed.obj', 70.0, 2.0), new ParticleMesh('objekti/kocka.obj')];
const objectCount = objects.length;
var currentObjectIndex = 0;
var object = objects[currentObjectIndex];

var textures = [];
var textureCount = 0;
var currentTextureIndex = 0;
var texture;

var shouldReloadBuffers = true;
var minMax = findMaxAndMinCoordinate(object.vertices);
var textureMap = mapTexture(object.vertices);
object.reloadCache();

main();

//
// Start here
//
function main() {
  const canvas = document.querySelector('#glcanvas');
  document.addEventListener('keydown', keyDownHandler, false);
  document.addEventListener('keyup', keyUpHandler, false);
  const gl = canvas.getContext('webgl');

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }


  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const ditherProgram = initShaderProgram(gl, vsSource, ditherFSSource);
  const hslDitherProgram = initShaderProgram(gl, vsSource, hslDitherFSSource);
  const outlineProgram = initShaderProgram(gl, outlineVsSource, outlineFsSource);

  const programs = [hslDitherProgram, shaderProgram,  ditherProgram, outlineProgram];

  const programInfos = programs.map(shaderProgram => {
    return {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
        uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
      },
    };
  });

  textures = [loadTexture(gl, 'textures/color_gradient.png'), loadTexture(gl, 'textures/updown.jpg'), loadTexture(gl, 'textures/cubetexture.png'), loadTexture(gl, 'textures/rainbow.jpg')]
  textureCount = textures.length;
  texture = textures[currentTextureIndex];

  var buffers = initBuffers(gl, object, textureMap, object.indices);

  var then = 0;

  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    if(deltaTime > 0.06) {
      requestAnimationFrame(render);
      return;
    }
    if(usePhysics) {
      object.bonds.forEach(bond => bond.calculateForceOnParticles());
      object.vertices_.forEach(particle => {
        if(Math.floor(Math.random() * 10) > 5) {
          particle.accumulateForce(
            vec3.fromValues(Math.random() * wind[0],
                            Math.random() * wind[1],
                            Math.random() * wind[2]));
        }
        particle.applyForce(deltaTime)
      });
      object.reloadCache();
    }
    preDrawSetup(gl);
    if(shouldReloadBuffers || usePhysics) {
      buffers = initBuffers(gl, object, textureMap, object.indices);
    }
    var offset = (minMax.min[0]*2);
    if(offset == 0) {
      offset = 2;
    }
    var i = 0;
    programInfos.forEach(programInfo => {
      if(i === 3) {
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
      } else if(i === 0) {
        offset = 0;
      } else {
        offset -= offset*2.0;
      }
      
      drawScene(gl, programInfo, buffers, texture, deltaTime, offset, gl.TRIANGLES);
      
      i++;
      gl.disable(gl.CULL_FACE);
      if(i === 1) {
        offset = (minMax.min[0]*2);
      }
    });
    

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function changeObject(index) {
  object = objects[index];
  minMax = findMaxAndMinCoordinate(object.vertices);
  textureMap = mapTexture(object.vertices);
  shouldReloadBuffers = true;
  usePhysics = false;
}

function changeTexture(index) {
  texture = textures[index];
  shouldReloadBuffers = true;
}

function keyDownHandler(event) {
  if(event.keyCode == Keys.right) {
    if (!rightPressed) {
      cubeRotationY -= 0.5;
    }
      rightPressed = true;
  }
  else if(event.keyCode == Keys.left) {
    if (!leftPressed) {
      cubeRotationY += 0.5;
    }
      leftPressed = true;
  }
  if(event.keyCode == Keys.down) {
    if (!downPressed) {
      cubeRotationX += 2;
    }
    downPressed = true;
  }
  else if(event.keyCode == Keys.up) {
    if (!upPressed) {
      cubeRotationX -= 2;
    }
    upPressed = true;
  }
  if(event.keyCode == Keys.s) {
    if (!sPressed) {
      if(wind[0] == 0.0) wind = vec3.fromValues(5,0.2,-0.5);
      else if(wind[0] == 5) wind = vec3.fromValues(-5,0.2,-0.5);
      else wind = vec3.create();
    }
      sPressed = true;
  }
  if(event.keyCode == Keys.x) {
    if (!xPressed) {
      usePhysics = !usePhysics;
    }
      xPressed = true;
  }

  if(event.keyCode == Keys.c) {
    if (!cPressed) {
      currentObjectIndex = (currentObjectIndex+1) % objectCount;
      changeObject(currentObjectIndex);
    }
      cPressed = true;
  }

  if(event.keyCode == Keys.t) {
    if (!tPressed) {
      currentTextureIndex = (currentTextureIndex+1) % textureCount;
      changeTexture(currentTextureIndex);
    }
      tPressed = true;
  }
}

function keyUpHandler(event) {
  if(event.keyCode == Keys.right) {
      rightPressed = false;
  }
  else if(event.keyCode == Keys.left) {
      leftPressed = false;
  }
  if(event.keyCode == Keys.down) {
    downPressed = false;
  }
  else if(event.keyCode == Keys.up) {
    upPressed = false;
  }
  if(event.keyCode == Keys.s) {
    sPressed = false;
  }
  if(event.keyCode == Keys.x) {
    xPressed = false;
  }
  if(event.keyCode == Keys.c) {
    cPressed = false;
  }
  if(event.keyCode == Keys.t) {
    tPressed = false;
  }
}

function findMaxAndMinCoordinate(vertices) {
  var max = [vertices[0], vertices[1], vertices[2]];
  var min = [vertices[0], vertices[1], vertices[2]];
  for(var i = 3; i < vertices.length; i+=3) {
    if(vertices[i]   > max[0]) max[0] = vertices[i];
    if(vertices[i+1] > max[1]) max[1] = vertices[i+1];
    if(vertices[i+2] > max[2]) max[2] = vertices[i+2];

    if(vertices[i]   < min[0]) min[0] = vertices[i];
    if(vertices[i+1] < min[1]) min[1] = vertices[i+1];
    if(vertices[i+2] < min[2]) min[2] = vertices[i+2];
  }
  
  return {
    max : max,
    min : min
  }
}

function mapTexture(vertices) {
  const minMax = findMaxAndMinCoordinate(vertices);
  const max = minMax.max; const min = minMax.min;

  var texCoords = [];
  var i0 = 0;
  var i1 = 1;
  if(max[i0] == min[i0]) {
    i0 = 2;
  } else if(max[i1] == min[i1]) {
    i1 = 2;
  }
  for(var i = 0; i < vertices.length; i+=3){
    texCoords.push( (vertices[i+i0]-min[i0])/(max[i0]-min[i0]),
                    (vertices[i+i1]-min[i1])/(max[i1]-min[i1])
                  );
  }

  return texCoords;
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers(gl, cube1, textureMap, indices) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.

  // const newPos = cube1.vertices_.flatMap(v => [v[0], v[1], v[2]]);
  const newPos = cube1.vertices;
  const normales = cube1.normales;
  const count = indices.length;

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newPos), gl.STATIC_DRAW);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Set up the normals for the vertices, so that we can compute lighting.

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normales),
                gl.STATIC_DRAW);

  // Now set up the texture coordinates for the faces.

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  // const textureMap1 = mapTexture(newPos);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureMap),
                gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    normal: normalBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
    vertexCount: (count)
  };
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function calculateNormale(v1,v2,v3){
  var normal = vec3.cross(v2 - v1, v3 - v1);
  return {
    normale : vec3.normalize(normal)
  }
}

function preDrawSetup(gl) {
  gl.clearColor(0.2, 0.2, 0.2, 1.0);  
  gl.clearDepth(1.0);                 
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, texture, deltaTime, translationOffset, primitive) {
  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [translationOffset, 0.0, cubeRotationX]);  // amount to translate
  // mat4.scale(modelViewMatrix,
  //            modelViewMatrix,
  //            [0.5,0.5,1.0]);
  // mat4.rotate(modelViewMatrix,  // destination matrix
  //             modelViewMatrix,  // matrix to rotate
  //             cubeRotation,     // amount to rotate in radians
  //             [0, 0, 1]);       // axis to rotate around (Z)
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              cubeRotationY,// amount to rotate in radians
              [0, 1, 0]);       // axis to rotate around (X)
  mat4.rotate(modelViewMatrix,  // destination matrix
                modelViewMatrix,  // matrix to rotate
                cubeRotationX * 0,// amount to rotate in radians
                [1, 0, 0]);       // axis to rotate around (X)

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the texture coordinates from
  // the texture coordinate buffer into the textureCoord attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.textureCoord);
  }

  // Tell WebGL how to pull out the normals from
  // the normal buffer into the vertexNormal attribute.
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexNormal);
  }

  // Tell WebGL which indices to use to index the vertices
  // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.normalMatrix,
      false,
      normalMatrix);

  // Specify the texture to map onto the faces.

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const vertexCount = buffers.vertexCount;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    
    gl.drawElements(primitive, vertexCount, type, offset);
  }

  cubeRotation += deltaTime;
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

