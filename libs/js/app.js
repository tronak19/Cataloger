var fs = require("fs");
var mp3Duration = require('mp3-duration');
const {dialog} = require("electron").remote;
var acoustid = require("acoustid");
var fpcalc = require("fpcalc");
var key = "3r9GGDvVf2";
var files = [];
var fingerprints = []
var path;
var table = document.getElementById("mytable");
var table_head = document.getElementById("table_head");
var table_body = document.getElementById("table_body");
var checked_all_flag = false;
var update_progress_bar_counter = 0;
var i=0;
var full_path;
var len;
var items = [];

$(document).ready(function(){

	$("#select_file_folder").click(open_file_dialog);
	$("#go").click(go);
	$("#select_all_checkbox").change(checks_change);
	$("#rename").click(rename);
	$("#reset").click(reset);
	// $("#table_body input[type='checkbox']").change(handle_individual_check);
	$(document).on("change", "#table_body input[type='checkbox']", handle_individual_check)
});

function open_file_dialog(){
	console.log("[function]::open_file_dialog");
	path  = dialog.showOpenDialog({
		title:"Select Directory",
		properties:['openDirectory','openFile','multiSelections']
	});
	console.log(path);
	populate_file_lists(path[0]);
}

function reset(){
	$("input[type='checkbox']").attr('disabled', false);
	update_progress_bar_counter = 0;
	location.reload();
}

function populate_file_lists(path){
	fs.readdir(path, function(err, items_){
		items = items_.slice();
		console.log("File contents are ", items);
		counter = 0;
		for(i=0; i<items.length; i++){
			console.log(items[i]);
			if((items[i].indexOf(".mp3") != -1) && (items[i].indexOf(".mp3") == (items[i].length-4))){
				
				full_path = path+"\\"+items[i];
		
				var file_obj = {
					count:counter,
					original_file:items[i],
					path:path,
					checked:true,
				}
				files.push(file_obj);
				console.log("file_obj = ", file_obj);
			
				// populate table
				var curr_row = table_body.rows.length;			
				console.log("curr_row = ", curr_row);
				var row = table_body.insertRow(curr_row);
				var cell1 = row.insertCell(0);
				var cell2 = row.insertCell(1);
				var cell3 = row.insertCell(2);
				cell1.innerHTML = "<input type=\"checkbox\" id=cell_" + counter + " value=\"no\" class=\"checkbox\" checked>";
				cell2.innerHTML = "<p id=\"file_"+counter+"\">" + file_obj.original_file + "</p>";
				// cell3.innerHTML = file_obj.converted_file;
				cell3.innerHTML = "<p id=\"converted_"+counter+"\">" +  "</p>";
				counter+=1;
				console.log("files" );
				console.log(files);	
				
			}
		}
	});

	console.log("File logger");
	console.log(files);
	// go();
}

function get_duration(i){
	full_path = files[i].path + "\\" + files[i].original_file;
	console.log("inside get_duration : path is " , full_path);
	mp3Duration(full_path, function (err, duration) {
  					if (err) return console.log(err.message);
  					// len = Math.round(duration);
  					len = duration;
					console.log('Duration = ', len);
					return len;
				});
	return len;
}

function checks_change(){
	if( $(this).is(":checked") ){
		console.log("Select All Checked");
		checked_all_flag = true;
		for(var i=0; i<files.length; i++){
			files[i].checked = true;
			var c = files[i].count;
			console.log("cell_",c);
			console.log(document.getElementById("#cell_"+String(c)));
			$("#cell_"+String(c)).attr("checked" , true);
		}
		
	}else{
		console.log("Select All Unchecked");
		checked_all_flag = false;
		for(var i=0; i<files.length; i++){
			files[i].checked = false;
			var c = files[i].count;
			$("#cell_"+String(c)).attr("checked" , false);
		}
	}
}

function handle_individual_check(){
	// console.log($(this));
	var index = $(this)[0].id.split("_");
	index = index[index.length-1];
	// console.log(index[index.length-1]);
	files.find(function(item){
		// console.log(item);
		// console.log(index);
		if(item.count == parseInt(index)){
			item.checked = $($(this)[0]).is(":checked");
			// console.log($(this)[0].is(":checked"));
			// console.log(item);
			return true;
		}
		return false;
	});
}

function go(){
	// deactivate all checkboxes
	$("input[type='checkbox']").attr('disabled', true);
	for(var i=0; i<files.length; i++){
		if(files[i].checked){
			var file = files[i];
			var path = files[i].path + "\\" + files[i].original_file;
			acoustid(path, {key : key}, response_callback(i));
		}
	}
}

// function handle_fpcalc(i){
// 	return function(err, result){
// 		if(err) throw err;
// 		files[i].duration = result.duration;
// 	}
// }

function response_callback(i){
	return function(err, results){
		var full_path = files[i].path + "\\" + files[i].original_file;
		return mp3Duration(full_path, function(err, duration){
			console.log("duration is ", duration);
			console.log("I IS " , i);
			console.log("other data is ", results);
			
			
			console.log("LEN IS : " + len);
			if (err) throw err;
			console.log(i);
			console.log("results = ", results);
			files[i].response = results;
			// update columns
			
			var lower_limit=duration-2;
			var upper_limit=duration+2;
			console.log("LL = "+lower_limit+"\nUL = "+upper_limit);
			console.log("FP = ",files[i].path);
			if(results.length > 0){
				var recordings, artist_name, title;
				for(j=0; j<results[0].recordings.length; j++){
					if (results[0].recordings[j].duration>lower_limit && results[0].recordings[j].duration<upper_limit){
						recordings = results[0].recordings[j];
						artist_name = recordings.artists[0].name;
						title = recordings.title;
						console.log(artist_name + " - " + title);
					}

				}

				// var first_result = results[0];
				// var recordings = first_result.recordings[0];
				// var artist_name = recordings.artists[0].name;
				// var title = recordings.title;
				// console.log(title + " - " + artist_name);
				var final_new_name = artist_name + " - " + title + ".mp3";
				files[i].converted_file = final_new_name;

				// update ui
				// $($("#table_body tr")[i]).eq(2).html("aaa");
				console.log($("#converted_"+ String(i)));
				$("#converted_"+String(i)).html(final_new_name);
				value_now = Math.round((((update_progress_bar_counter++) + 1)/files.length)*100);
				$("#progressbar").css('width', value_now+"%").attr("aria-valuenow", value_now);
			}

			else $("#converted_"+String(i)).html("No match found in database");
			
		});
	}
}


function rename(){
	console.log(files);
	for(var i=0; i<files.length; i++){
		var inp = files[i].path + "\\" + files[i].original_file; 
		var out = files[i].path + "\\" + files[i].converted_file;
		fs.rename(inp, out, function (err) {
			if (err) throw err;
			console.log("File Renamed");
		});
	}

	alert("Complete. Please ceck your files.","Cataloger");
}