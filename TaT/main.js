/*
Imports
*/
import {Setup_model} from './NavieBayes_Gaussian.js';
/*
variables
*/
var fakeDataX = [4, 2, 5, 20, 20, 1, 5, 3]
const cls = require('./NativeBayes_Gaussian');


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
prediction = cls.predict(fakeDataX);
console.log(prediction);
prediction = cls.predict([1,1,1,1,1,1,1,1])
console.log(prediction);
}