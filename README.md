# webGl-dithering
Implementation of dithering algorithm for color compression written in webgl, using shaders

## About
This program is used to showcase 2 distinct features.
1. Dithering algorithm
2. Cloth physics simulation

### Dithering algorithm
The intial idea for the algorith came from this [article](http://alex-charlton.com/posts/Dithering_on_the_GPU/) describing the use of dithering in modern graphics for aesthetic purposes. The algorithm is implemented to take advantage of the GPU paralelization and the whole dithering process is done on the GPU. A nice example this effect is done in the game [Return of the Obra Dinn (2018)](https://obradinn.com).

## Cloth physics simulation
Second part of the project is simulation of a piece of cloth in the wind based on a system of springs and masses. Numerical integration is done using the mixed Euler method. The project also implements collision with simple objects, such as spheres and cubes.

## Installation
The whole project is written in javascript, and it just has to be deployed using your preffered HTTP server.

### Example installation
The following example illustrates how to clone the project and run it with npm package `reload` (requries `reload` package to be installed, more info [here](https://www.npmjs.com/package/reload))

```bash
git clone https://github.com/donikv/webGl-dithering.git
cd webGl-dithering
reload -b
```
After that open (http://localhost:8080) in your browser that supports WebGL (most modern browsers). 

## Running the program
The program implements rudimentary options for controlling the camera and changing currently displayed objects and textures that are applied to them.

### Commands
| Comamnd                     | Action                                            |
| :-------------:             | :-------------:                                   |
| Up and down arrow keys      | Change the distance of the object from the camera |
| Left and right arrow keys   | Rotate the object                                 |
| c key                       | Change the current model                          |
| t key                       | Change the current texture                        |
| x key                       | Toggle physics                                    |
| s key                       | Toggle wind direction                             |
| w key                       | Toggle collision                                  | 

### Examples

![Dithering](https://imgur.com/60TY9xH)

![Cloth simulation](https://imgur.com/JuPf4ki)