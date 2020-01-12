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
var drawerWord;
var roundTime = 10;
var timeleft = roundTime;
var timerRunning = false;
var top5Names = []
var top5Accs = []
var fakePlayers = ['Alex', 'Jen', 'Boyd', 'Jichen', 'Evan']
var fakeGuesses = ['apple', 'jerky', 'banana', 'jackhammer', 'ewok']
/*
prepare the drawing canvas 
*/
$(function() {
    canvas = window._canvas = new fabric.Canvas('canvas');
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
    canvas.on('mouse:down', function(e) {
        mousePressed = true
    });
    canvas.on('mouse:move', function(e) {
        recordCoor(e)
    });
	loadDict()
	start()
})

/*
load the class names 
*/
async function loadDict() {
    loc = 'DL_Game/model/class_names.txt'
    //console.log("dict loaded")
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
    for (var i = 0; i < lst.length - 1; i++) {
        let symbol = lst[i]
        classNames[i] = symbol
    }
	//console.log("classnames loaded into js obj")
}


/*
load the model
*/
async function start() {
	console.log("started")
    
    //load the model 
    model = await tf.loadLayersModel('DL_Game/model/model.json')
    
    //warm up 
    model.predict(tf.zeros([1, 28, 28, 1]))
    
    //allow drawing on the canvas 
    allowDrawing()
    
    //load the class names
    await loadDict()
	getDrawerWord(classNames)
}

/*
set the table of the predictions 
*/
function setTable(top5, probs) {
    //loop over the predictions 
    for (var i = 0; i < top5.length; i++) {
        let sym = document.getElementById('sym' + (i + 1))
        let prob = document.getElementById('prob' + (i + 1))
        sym.innerHTML = "???"
        prob.innerHTML = Math.round(probs[i] * 100)
    }
	console.log("table set")
    //create the pie 
    createPie(".pieID.legend", ".pieID.pie");

}

/*
record the current drawing coordinates
*/
function recordCoor(event) {
    var pointer = canvas.getPointer(event.e);
    var posX = pointer.x;
    var posY = pointer.y;

    if (posX >= 0 && posY >= 0 && mousePressed) {
		roundStarted(timeleft)
        coords.push(pointer)
		console.log("coor recorded")
    }
}

/*
get the best bounding box by trimming around the drawing
*/
function getMinBox() {
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

    //return as strucut 
    return {
        min: min_coords,
        max: max_coords
    }
	console.log("minibox done")
}

/*
get the current image data 
*/
function getImageData() {
        //get the minimum bounding box around the drawing 
        const mbb = getMinBox()

        //get image data according to dpi 
        const dpi = window.devicePixelRatio
        const imgData = canvas.contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
                                                      (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi);
        return imgData
    }

/*
get the prediction 
*/
function getFrame() {
    //make sure we have at least two recorded coordinates 
    if (coords.length >= 2) {

        //get the image data from the canvas 
        const imgData = getImageData()

        //get the prediction 
        const pred = model.predict(preprocess(imgData)).dataSync()

        //find the top 5 predictions 
        const indices = findIndicesOfMax(pred, 5)
        const probs = findTopValues(pred, 5)
        const names = getClassNames(indices)
		top5Names = names
		top5Accs = probs

        //set the table 
        setTable(names, probs)
		setPlayerTable(fakePlayers, fakeGuesses)
    }

}

/*
get the the class names 
*/
function getClassNames(indices) {
    var outp = []
    for (var i = 0; i < indices.length; i++)
        outp[i] = classNames[indices[i]]
    return outp
}
/*
get indices of the top probs
*/
function findIndicesOfMax(inp, count) {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
        outp.push(i); // add index to output array
        if (outp.length > count) {
            outp.sort(function(a, b) {
                return inp[b] - inp[a];
            }); // descending sort the output array
            outp.pop(); // remove the last index (index of smallest element in output array)
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
    // show 5 greatest scores
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

        //We add a dimension to get a batch shape 
        const batched = normalized.expandDims(0)
        return batched
    })
}

/*
allow drawing on canvas
*/
function allowDrawing() {
    canvas.isDrawingMode = 1;
	document.getElementById('status').innerHTML = 'Model Loaded';
    $('button').prop('disabled', false);
    var slider = document.getElementById('myRange');
    slider.oninput = function() {
        canvas.freeDrawingBrush.width = this.value;
    };
}

/*
clear the canvs 
*/
function erase() {
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    coords = [];
}

/*
Randomize a word from list for Drawer to Drawer
*/
function getDrawerWord(list) {
	idx = Math.floor(Math.random() * (list.length+1))
	console.log(idx)
	word = list[idx]
	console.log(word)
	document.getElementById('draw_word').innerHTML = word;
}
/*
Timer for rounds and draw-times
*/
function startDrawTimer(time) {
	if (timerRunning == false) {
		timerRunning = true;
		var timer = setInterval(function(){
			time--;
			document.getElementById("timer").innerHTML = time;
			if(time <=0){
				clearInterval(timer);
				midRound();
				timerRunning = false;
			}
		}, 1000);
	}
}
/*
Restart Timer Displayed
*/
function restartTimer() {
	document.getElementById("timer").innerHTML = roundTime;
}
/*
Start round function
*/
function roundStarted(time) {
	startDrawTimer(time)
}
/*
Mid round -- go over results, switch drawer, randomize new word
*/
function midRound() {
	revealModelGuesses(top5Names, top5Accs)
	console.log(top5Names)
}

/*
start new round
*/
function newRound () {
	erase()
	restartTimer()
	getDrawerWord(classNames);
}

/*
reveal model guesses
*/
function revealModelGuesses (top5, acc) {
	for (var i = 0; i < top5.length; i++) {
        let sym = document.getElementById('sym' + (i + 1))
        let prob = document.getElementById('prob' + (i + 1))
        sym.innerHTML = top5[i]
        prob.innerHTML = Math.round(acc[i] * 100)
    }
}
/*
set Player table for their guesses
*/
function setPlayerTable(players, guesses) {
    //loop over the predictions 
    for (var i = 0; i < players.length; i++) {
        let guess = document.getElementById('guess_p' + (i + 1))
        let name = document.getElementById('name_p' + (i + 1))
        guess.innerHTML = guesses[i]
        name.innerHTML = players[i]
    }
	console.log("table set")
    //create the pie 
    createPie(".pieID.legend", ".pieID.pie");

}