function loadObjFromFile(file) {

    var objText = getObjFile(file);
    var obj = {};
    var vertexMatches = objText.match(/^v( -?\d+(\.\d+)?){3}$/gm);
    if (vertexMatches) {
        obj.vertices = vertexMatches.map(function(vertex) {
            var vertices = vertex.split(" ");
            vertices.shift();
            return vec4.fromValues(...vertices, 1.0);
        });
    }
    var faceIndexMatches = objText.match(/^f( -?\d+(\.\d+)?){3}$/gm);
    if (faceIndexMatches) {
        obj.indices = faceIndexMatches.map(index => {
            var indices = index.split(" ");
            indices.shift();

            return indices.map(i => i-1);
        }).flatMap(x => x);
    }

    return obj;
}

function getObjFile(file) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", file, false);
    xhr.send(null);

    if (xhr.status === 200) {}
    return xhr.responseText;
}

function loadModelFromJSON(file){
    var request = new XMLHttpRequest();
    //console.info('Requesting ' + teapot);
    request.open("GET", file, false);
    request.send();
    var teapotObj = JSON.parse(request.responseText);
    return teapotObj;
    request.onreadystatechange = function () {
        if (request.readyState == 4) {

            if (request.status == 404) {
                console.info(teapot + ' does not exist');
            }
            else {

                var teapotObj = JSON.parse(request.responseText);
                return teapotObj;
            }
        }
    };
    request.send();
}