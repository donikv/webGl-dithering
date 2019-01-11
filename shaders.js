
  const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec2 aTextureCoord;

  uniform mat4 uNormalMatrix;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying highp vec2 vTextureCoord;
  varying highp vec3 vLighting;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;

    // Apply lighting effect

    highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec4 lightPosition = vec4(-5, 2, 5, 1);
    highp vec4 v4 = gl_Position - lightPosition;
    highp vec3 directionalVector = normalize(v4.xyz);

    highp vec4 transformedNormal = normalize(uNormalMatrix * vec4(aVertexNormal, 1.0));

    highp float directional = max(dot(aVertexNormal, directionalVector), 0.0);
    vLighting = ambientLight + (directionalLightColor * directional);
  }
`;

// Fragment shader program

const fsSource = `
  varying highp vec2 vTextureCoord;
  varying highp vec3 vLighting;

  uniform sampler2D uSampler;

  void main(void) {
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

    gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
  }
`;

const ditherFSSource = `
varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;

uniform sampler2D uSampler;

precision highp float;


float mod2(float a, float b) {
   return a - (b * floor(a/b));
}

float indexMatrix4x4(int index) { //add as an input parameter
  if(index ==0) return 0. ; if(index ==1) return 8.; if(index ==2) return 2. ; if(index ==3) return 10.;
    if(index ==4) return 12.; if(index ==5) return 4.; if(index ==6) return 14.; if(index ==7) return 6. ;
    if(index ==8) return 3.; if(index ==9) return 11.; if(index ==10) return 1. ; if(index ==11) return 9.;
    if(index ==12) return 15.; if(index ==13) return 7.; if(index ==14) return 13.; if(index ==15) return 5.; 
}

float indexMatrix8(int index) {
  if(index ==0) return 0.; if(index ==1) return 32.; if(index ==2) return 8.; if(index ==3) return 40.; if(index ==4) return 2.; if(index ==5) return 34.; if(index ==6) return 10.; if(index ==7) return 42.; if(index ==8) return 48.; if(index ==9) return 16.; if(index ==10) return 56.; if(index ==11) return 24.; if(index ==12) return 50.; if(index ==13) return 18.; if(index ==14) return 58.; if(index ==15) return 26.; if(index ==16) return 12.; if(index ==17) return 44.; if(index ==18) return 4.; if(index ==19) return 36.; if(index ==20) return 14.; if(index ==21) return 46.; if(index ==22) return 6.; if(index ==23) return 38.; if(index ==24) return 60.; if(index ==25) return 28.; if(index ==26) return 52.; if(index ==27) return 20.; if(index ==28) return 62.; if(index ==29) return 30.; if(index ==30) return 54.; if(index ==31) return 22.; if(index ==32) return 3.; if(index ==33) return 35.; if(index ==34) return 11.; if(index ==35) return 43.; if(index ==36) return 1.; if(index ==37) return 33.; if(index ==38) return 9.; if(index ==39) return 41.; if(index ==40) return 51.; if(index ==41) return 19.; if(index ==42) return 59.; if(index ==43) return 27.; if(index ==44) return 49.; if(index ==45) return 17.; if(index ==46) return 57.; if(index ==47) return 25.; if(index ==48) return 15.; if(index ==49) return 47.; if(index ==50) return 7.; if(index ==51) return 39.; if(index ==52) return 13.; if(index ==53) return 45.; if(index ==54) return 5.; if(index ==55) return 37.; if(index ==56) return 63.; if(index ==57) return 31.; if(index ==58) return 55.; if(index ==59) return 23.; if(index ==60) return 61.; if(index ==61) return 29.; if(index ==62) return 53.; if(index ==63) return 21.; 
}

float indexValue() {
    int x = int(mod2(gl_FragCoord.x, 8.));
    int y = int(mod2(gl_FragCoord.y, 8.));
    int index = (x + y * 8);
    return float(indexMatrix8(index)) / 64.0;
}

vec3 dither(vec3 color) {
  //highp float x = abs(color.x-0.5) < 0.0001 ? 0.49 : color.x;
    highp float x = color.x;
    highp vec3 grayscaleColor = vec3(x,x,x);
    highp vec3 closestColors = vec3((x < 0.5) ? 0.0 : 1.0, (x < 0.5) ? 0.0 : 1.0, (x < 0.5) ? 0.0 : 1.0);
    highp vec3 secondClosestColors = vec3(1.0, 1.0, 1.0) - closestColors;
    float d = indexValue();
    float distance = abs(x - closestColors.x);
    return (distance < d) ? closestColors : secondClosestColors;
}

void main () {
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
    gl_FragColor = vec4(dither(texelColor.rgb * vLighting), texelColor.a);
}
`;

const hslDitherFSSource = `
varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;

uniform sampler2D uSampler;

precision highp float;

float Epsilon = 1e-10;

float hueDistance(float h1, float h2) {
  float diff = abs((h1 - h2));
  return min(abs((1.0 - diff)), diff);
}


vec3 palette(int index) {
  return vec3(30.0*float(index)/255.0, 1.0, 0.5);
}

vec3 closestColors(float hue, int index) {
  vec3 closest = vec3(-2, 0, 0);
  vec3 secondClosest = vec3(-2, 0, 0);
  vec3 temp;
  for (int i = 0; i < 8; ++i) {
      temp = palette(i);
      float tempDistance = hueDistance(temp.x, hue);
      if (tempDistance < hueDistance(closest.x, hue)) {
          secondClosest = closest;
          closest = temp;
      } else {
          if (tempDistance < hueDistance(secondClosest.x, hue)) {
              secondClosest = temp;
          }
      }
  }
  if(float(index - 1) < Epsilon) {
    return closest;
  } else {
    return secondClosest;
  }
}

float mod2(float a, float b) {
  return a - (b * floor(a/b));
}

float indexMatrix4x4(int index) { //add as an input parameter
  if(index ==0) return 0. ; if(index ==1) return 8.; if(index ==2) return 2. ; if(index ==3) return 10.;
    if(index ==4) return 12.; if(index ==5) return 4.; if(index ==6) return 14.; if(index ==7) return 6. ;
    if(index ==8) return 3.; if(index ==9) return 11.; if(index ==10) return 1. ; if(index ==11) return 9.;
    if(index ==12) return 15.; if(index ==13) return 7.; if(index ==14) return 13.; if(index ==15) return 5.; 
}

float indexMatrix8(int index) {
  if(index ==0) return 0.; if(index ==1) return 32.; if(index ==2) return 8.; if(index ==3) return 40.; if(index ==4) return 2.; if(index ==5) return 34.; if(index ==6) return 10.; if(index ==7) return 42.; if(index ==8) return 48.; if(index ==9) return 16.; if(index ==10) return 56.; if(index ==11) return 24.; if(index ==12) return 50.; if(index ==13) return 18.; if(index ==14) return 58.; if(index ==15) return 26.; if(index ==16) return 12.; if(index ==17) return 44.; if(index ==18) return 4.; if(index ==19) return 36.; if(index ==20) return 14.; if(index ==21) return 46.; if(index ==22) return 6.; if(index ==23) return 38.; if(index ==24) return 60.; if(index ==25) return 28.; if(index ==26) return 52.; if(index ==27) return 20.; if(index ==28) return 62.; if(index ==29) return 30.; if(index ==30) return 54.; if(index ==31) return 22.; if(index ==32) return 3.; if(index ==33) return 35.; if(index ==34) return 11.; if(index ==35) return 43.; if(index ==36) return 1.; if(index ==37) return 33.; if(index ==38) return 9.; if(index ==39) return 41.; if(index ==40) return 51.; if(index ==41) return 19.; if(index ==42) return 59.; if(index ==43) return 27.; if(index ==44) return 49.; if(index ==45) return 17.; if(index ==46) return 57.; if(index ==47) return 25.; if(index ==48) return 15.; if(index ==49) return 47.; if(index ==50) return 7.; if(index ==51) return 39.; if(index ==52) return 13.; if(index ==53) return 45.; if(index ==54) return 5.; if(index ==55) return 37.; if(index ==56) return 63.; if(index ==57) return 31.; if(index ==58) return 55.; if(index ==59) return 23.; if(index ==60) return 61.; if(index ==61) return 29.; if(index ==62) return 53.; if(index ==63) return 21.; 
}

float indexValue() {
    int x = int(mod2(gl_FragCoord.x, 8.));
    int y = int(mod2(gl_FragCoord.y, 8.));
    int index = (x + y * 8);
    return float(indexMatrix8(index)) / 64.0;
}

vec3 RGBtoHCV(vec3 RGB)
{
  vec4 P = (RGB.y < RGB.z) ? vec4(RGB.z, RGB.y, -1.0, 2.0/3.0) : vec4(RGB.y, RGB.z, 0.0, -1.0/3.0);
  vec4 Q = (RGB.x < P.x) ? vec4(P.x, P.y, P.w, RGB.x) : vec4(RGB.x, P.y, P.z, P.x);
  float C = Q.x - min(Q.w, Q.y);
  float H = abs((Q.w - Q.y) / (6.0 * C + Epsilon) + Q.z);
  return vec3(H, C, Q.x);
}

float clamp2(float value, float a, float b) {
  return min(a, max(b, value));
}

vec3 HUEtoRGB(float H)
{
  float R = abs(H * 6.0 - 3.0) - 1.0;
  float G = 2.0 - abs(H * 6.0 - 2.0);
  float B = 2.0 - abs(H * 6.0 - 4.0);
  return clamp(vec3(R,G,B),0.0,1.0);
}

vec3 hslToRgb(vec3 HSL)
{
  vec3 RGB = HUEtoRGB(HSL.x);
  float C = (1.0 - abs(2.0 * HSL.z - 1.0)) * HSL.y;
  return (RGB - 0.5) * C + HSL.z;
}

vec3 rgbToHsl(vec3 RGB)
{
  vec3 HCV = RGBtoHCV(RGB);
  float L = HCV.z - HCV.y * 0.5;
  float S = HCV.y / (1.0 - abs(L * 2.0 - 1.0) + Epsilon);
  return vec3(HCV.x, S, L);
}

vec3 dither(vec3 color) {
    vec3 hsl = rgbToHsl(color);
    vec3 closestColor = closestColors(hsl.x,1);
    vec3 secondClosestColor = closestColors(hsl.x,2);
    float d = indexValue();
    float hueDiff = hueDistance(hsl.x, closestColor.x) /
                  hueDistance(secondClosestColor.x, closestColor.x);
    return hslToRgb(hueDiff < d ? closestColor : secondClosestColor);
}

vec3 ditherGrayscale(vec3 color) {
    //highp float x = abs(color.x-0.5) < 0.0001 ? 0.49 : color.x;
      highp float x = color.x;
      highp vec3 grayscaleColor = vec3(x,x,x);
      highp vec3 closestColors = vec3((x < 0.5) ? 0.0 : 1.0, (x < 0.5) ? 0.0 : 1.0, (x < 0.5) ? 0.0 : 1.0);
      highp vec3 secondClosestColors = vec3(1.0, 1.0, 1.0) - closestColors;
      float d = indexValue();
      float distance = abs(x - closestColors.x);
      return (distance < d) ? closestColors : secondClosestColors;
  }

void main () {
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
    if(abs(texelColor.r - texelColor.g) < Epsilon && abs(texelColor.r - texelColor.b) < Epsilon) {
        gl_FragColor = vec4(ditherGrayscale(texelColor.rgb * vLighting), texelColor.a);
    } else {
        gl_FragColor = vec4(dither(texelColor.rgb * vLighting), texelColor.a);
    }
}
`;

const outlineVsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    void main(void)
    {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(vec3(aVertexPosition.x,aVertexPosition.y,aVertexPosition.z) + aVertexNormal * 0.05, 1.0);
    }
  `;
const outlineFsSource = `
  varying highp vec2 vTextureCoord;
  varying highp vec3 vLighting;

  uniform sampler2D uSampler;
  void main(void)
  {
      gl_FragColor = vec4(0.0,0.0,0.0,1.0);
  }
`;