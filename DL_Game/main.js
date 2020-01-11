/*
From Zaid Alyafeai's Medium Tutorial and Git

Rush Weigelt
1.10.20
*/

/*
variables
*/

var model;
var canvas;
var classNames = [];
var canvas;
var coords = [];
var mousePressed = false;
var mode;

/*
Prepare Canvas Info
*/
$(function() {
	canvas = windows._canvas = new fabric.Canvas('canvas');
	canvas.backgroundColor = '#ffffff';
	canvas.isDrawingMode = 0;
	canvas.freeDrawingBrush.color = "black";
	canvas.freeDrawingBrush.width = 10;
	canvas.renderAll();
	//setup listeners
	canvas.on('mouse:up', function(e) {
		getFrame();
		mousePressed = false
	});
	canvas.on('mouse.down', function(e) {
		mousePressed = true
	});
	canvas.on('mouse:move', function(e) {
		recordCoor(e)
	});
})

/*
set the table of predictions 
NOTE MAY DELETE LATER BY TAKING TOP5 NAMES OUT
*/
function setPredictionTable(top5, probs) {
	//loop over the predictions
	for (var i = 0; i < top5.length; i++) {
		let sym = document.getElementById('sym' + (i+1))
		let prob = document.getElementById('prob' + (i+1))
		sym.innerHTML = top5[i]
		prob.innerHTML = math.round(probs[i]*100)
	}
	//create pie chart
	createPie(".pieID.legend", "pieID.pie");
}

/*
get the best bounding box by trimming around the drawing
*/
function getMiniBox() {
	//get coordinates
	var coorX = coords.map(function(p) {
		return p.x
	});
	var coorY = coords.map(function(p) {
		return p.y
	});
	
	//find top left and bottom right corners
	var min_coords = {
		x: Math.min.apply(null, coorX),
		y: Math.min.apply(null, coorY)
	}
	
	var max_coords = {
		x: Math.max.apply(null, coorX),
		y: Math.max.apply(null, coorY)
	}
	
	//return as struct
	return {
		min: min_coords,
		max: max_coords
	}
}

/*
get the current image data
*/
function getImageData() {
	//get the min bounding box around drawing
	const mbb = getMinBox()
	
	//get image data according to dpi
	const dpi = window.devicePixelRatio
	const imgData = canvas.contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
                                                      (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi);
    return imgData
}

/*
get the predictions*/
function getFrame() {
	//make sure we have at least two recorded coordinates
	if(coords.length >= 2) {
		//get the image data from the canvas
		const imgData = getImageData()
		
		//get the predictions
		const pred = model.predict(preprocess(imgData)).dataSync()
		
		//find the top 5 predictions
		const indices = findIndicesOfMax(pred, 5)
		const probs = findTopValues(pred, 5)
		const names = getClassNames(indices)
		
		//set the table
		setTable(names, probs)
	}
}

/*
get the class names
*/
function getClassNames(indices) {
	var outp = []
	for (var i = 0; i < indices.length; i++)
		outp[i] = classNames[indices[i]]
	return outp
}

/*
load the class names
*/
async function loadDict() {
	if (mode == 'ar')
		loc = 'DL_Game/model/class_names_ar.txt'
	else
		loc='DL_Game/model/class_names.txt'
	
	await $.ajax({
		url: loc,
		dataType: 'text',
	}).done(success);
}

/*
load the class names
*/
function success(data) {
	const lst = data.split(/\n/)
	for (var i = 0; i < lst.length -1; i++) {
		let symbol = lst[i]
		classNames[i] = symbol
	}
}

/*
get indices of the top probs
*/
function findIndicesOfMax(inp, count) {
	var outp = [];
	for (var i = 0; i < inp.length; i++) {
		outp.push(i); //add index to output array
		if (outp.length > count) {
			outp.sort(function(a, b) {
				return inp[b] - inp[a];
			}); //descending sort the output array
			outp.pop(); //remove the last index(index of smallest in array)
		}
	}
	return outp;
}

/*
find the top 5 predictions
*/
function findTopValues(inp, count) {
	var outp = [];
	let indices = findIndicesOfMax(inp, count)
	//show 5 greatest scvores
	for (var i = 0; i < indices.length; i++)
		outp[i] = inp[indices[i]]
	return outp
}

/*
preprocess the data
*/
function preprocess(imgData) {
	return tf.tidy(() => {
		//convert to a tensor
		let tensor = tf.browser.fromPixels(imgData, numChannels = 1)
		
		//resize
		const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat()
		
		//normalize
		const offset = tf.scalar(255.0);
		const normalized = tf.scalar(1.0).sub(resized.div(offset));
		
		//add a dimension to get a batch shape
		const batched = normalized.expandDims(0)
		return batched
		})
}

/*
load the model
*/
async function start(cur_mode) {
	mode = cur_mode
	//load model
	model = await tf.loadLayersModel('model2/model.json')
	
	//warm up
	model.predict(tf.zeros([1, 28, 28, 1]))
	
	//allow drawing on the canvas
	allowDrawing()
	
	//load the class names
	await loadDict()
}

/*
allow drawing on canvas
*/
function allowDrawing() {
	canvas.isDrawingMode = 1;
	document.getElementById('status').innerHTML = 'Model Loaded':
	$('button').prop('disabled', false);
	var slider = document.getElementById('myRange');
	slider.oninput = function() {
		canvas.freeDrawingBrush.width = this.value;
	};
}

/*
Clear the canvas
*/
function erase() {
	canvas.clear();
	canvas.backgroundColor = '#ffffff';
	coords = [];
}


	