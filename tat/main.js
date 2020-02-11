/*

variables
*/
var fakeDataX = [4, 2, 5, 20, 20, 1, 5, 3];
var model;


/*
scrape hashtag that the user enters
*/
function Get_User_Hashtag() {
	var x = document.getElementById("user_hashtag").value;
	document.getElementById("report_display").innerHTML = x;
}

/*
function run_NB() {
	if hash node 2/dev/null; then
		node NaiveBayes_Gaussian.js 4 2 5 20 20 1 5 3
	fi
}
*/
function run_NB() {
    model = Setup_model();
    prediction = model.predict(fakeDataX);
    console.log(prediction);
    prediction = model.predict([1,1,1,1,1,1,1,1]);
    console.log(prediction);
}

function run_selected_model(user_selection) {
    if (user_selection.equals("Naive Bayes"))
    {
        run_NB();
    }
    else if (user_selection.equals("LSTM"))
    {
        run_LSTM();
    }
}

async function load_LSTM() {
    //load model
    model = await tf.loadLayersModel('models/model.json');
    //warm up
    model.predict([1,1,1,1,1,1,1,1]);
}

function LSTM_predict() {
    load_LSTM();
    const pred = model.predict([1,1,1,1,1,1,1,1]);
    console.log(pred);
}