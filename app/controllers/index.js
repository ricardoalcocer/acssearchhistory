var Cloud = require('ti.cloud');

var userID;

var historyRows = [{Name: "Texas", Symbol: "TXN"}, {Name: "Apple", Symbol: "AAPL"}];

function doopen(evt){
	if (OS_ANDROID){
		evt.source.activity.actionBar.title="Search History Demo"
	}
}

if (OS_IOS){
	$.infoButton.addEventListener('click', function(e) {
		showinfo();
	});
}

function showinfo(){
	alert("ACS Demo to show search history across a user's devices.");
}

function createUserACS(u,p,o){
	Ti.API.info("index: createUserACS(), u = "+u+", p="+p);
	if(Titanium.Network.networkType == Titanium.Network.NETWORK_NONE){
		alert("No Network. Please try again later.");
		return;
	}
	
	Cloud.Users.create({
		username  : u,
		password: p,
		password_confirmation: p,
	}, function(e){
		if (e.success) {
			Ti.API.info("index: New ACS userer creation successful");
			var user = e.users[0];
			userID = e.users[0].id;
			if (o.success) { o.success(); };            
		} else {
			alert("Server error, please try again later");
			if (o.error) { o.error("ACS: createUserACS(): Server error"); };
		}
	});
};


function ACSLogin(u,p,o){
	Ti.API.info("index: ACSLogin()");
	if(Titanium.Network.networkType == Titanium.Network.NETWORK_NONE){
		alert("No Network. Please try again later.");
		if (o.error) { o.error("ACSLogin(): No Network"); };
		return;
	}
	
	Ti.API.info("ACS: Logging in to ACS with username = "+u+", password = "+p);
	Cloud.Users.login({
	  login  : u,
	  password: p,
	}, function(e) {
	  if (e.success)   {
	  	Ti.API.info("index: Log in to ACS successful");
	  	Ti.API.info("index: Session ID = "+Cloud.sessionId);
	  	var user = e.users[0];
	  	userID = e.users[0].id;
	  	Ti.API.info("index: userID = "+userID);
	  	if (o.success) { o.success(); };  
	  } else {
	  	Ti.API.info('index: Login Error:' +((e.error && e.message) || JSON.stringify(e)));
	    createUserACS(u,p,{
	    	success: function(e) {
				Ti.API.info('index: Create user success'); 
				if (o.success) { o.success(); };  
			},
			error: function(e) {
				Ti.API.info(e);
				Ti.API.info('index: Logout failure');
				if (o.error) { o.error(); }; 
			}
	    });
	  } 
	});
};

function ACSReadHistory(o){
	Ti.API.info("index: ACSReadHistory()");
	
	if(Titanium.Network.networkType == Titanium.Network.NETWORK_NONE){
		if (o.error) { o.error("ACS: ACSRead(): No Network"); };
		return;
	}
	
	Cloud.Objects.query({classname:"history", page: 1, per_page: 5, where: {user_id: userID}}, function(e){
	    if (e.success) {
	        Ti.API.info("index: ACSRead(): Custom Object read successful"); 
	        Ti.API.info(e.history); 
	        if (o.success) { o.success(e); };
	    } else {
	    	Ti.API.info("index: ACSRead(): Custom Object delete failed");
	    	if (o.error) { o.error("index: ACSRead(): Server error"); };
	    }
	});
	return;
};

function storeHistoryLocal(e) {
	Ti.API.info("index: storeHistoryLocal(e), e = "+e);
	
	historyRows.length = 0; //clear array
	
	if(e.history.length>0){ 
		
        _.each(e.history, function(item) {
        		Ti.API.info("Name = "+item.Name);
        		Ti.API.info("Symbol = "+item.Symbol);
			historyRows.push({Name: item.Name, Symbol: item.Symbol});
		});
	}
	else {
		Ti.API.info("index: storeHistoryLocal(e) - NO HISTORY");
	}
}

function readHistory() {
	Ti.API.info("index: readHistory()");
	
	ACSReadHistory({
		success: function(e) {
			Ti.API.info('ACSReadHistory success');
			storeHistoryLocal(e);
		},
		error: function(e) {
			Ti.API.info(e);
			Ti.API.info('ACSReadHistory failure');
		}
	});
}

function addHistory() {
	Ti.API.info("index: addHistory()");

	_.each(historyRows, function(item) {
    		$.companyTV.appendRow(Alloy.createController('companyRow', {
			name: item.Name,
			symbol: item.Symbol,
			history: true
		}).getView());
	});
}

function resetTable() {
	Ti.API.info("index: resetTable()");
	
	var rd = [];
	$.companyTV.data = rd;
}

function writeToHistory(data, o) {
	Ti.API.info("index: writeToHistory()");
	
	if(Titanium.Network.networkType == Titanium.Network.NETWORK_NONE){
		if (o.error) { o.error("index: writeToHistory(): No Network"); };
		return;
	}

	Cloud.Objects.create({
	    classname: 'history',
	    fields: {
	        Name:data.Name,
	        Symbol:data.Symbol 
	    }
	}, function (e) {
		if (e.success) {
			Ti.API.info("index: writeToHistory(): Object create successful");
			Ti.API.info("index: writeToHistory: Object reply id = "+e.history[0].id);
			if (o.success) { o.success(e.history[0].id); };
		} else {
			Ti.API.info("index: writeToHistory(): Object create failed");
			if (o.error) { o.error("index: writeToHistory: Server error"); };
	    }
	});
};

function getQuote(symbol) {
	Ti.API.info("index: getQuote");
	
	if(Titanium.Network.networkType == Titanium.Network.NETWORK_NONE){
		Ti.API.info("markit: ondemand() - No Network");
		alert("No Network");
		return;
	}
	
	var xhr = Titanium.Network.createHTTPClient({
		onload: function() {
			alert(this.responseText)	;
		},
		onerror: function(e) {
			alert("Server Error");
		},
		timeout: 10000,
	});
	
	xhr.open("GET", "http://dev.markitondemand.com/Api/Quote/json?symbol="+symbol);
	xhr.send();
}

$.companyTV.addEventListener('click', function(e) {
	Ti.API.info("index: $.companyTV.addEventListener(click)");
	
	//alert("row clicked, symbol = "+e.row.history);
	if(!e.row.history) {
		//historyRows.push({Name: e.row.name, Symbol: e.row.symbol});
		writeToHistory({Name: e.row.name, Symbol: e.row.symbol}, {
			success: function(e) {
				Ti.API.info('Data written');
				readHistory();
			},
			error: function(e) {
				Ti.API.info('Error writing data = '+e);
				alert("No network or server not available. Please try again.");
			}
		});
	}
	
	$.companyTF.value="";
	$.companyTF.blur();
	
	getQuote(e.row.symbol);
	
});

$.companyTF.addEventListener('click', function(e){
	Ti.API.info("index: $.companyTF.addEventListener(click)");
	
	if($.companyTF.value=="" || $.companyTF.value==null) {
		readHistory();
		resetTable();
		addHistory();	
	}
});


$.companyTF.addEventListener('change', function(e){
	Ti.API.info("index: $.companyTF.addEventListener(change)");
	
	if($.companyTF.value=="" || $.companyTF.value==null) {
		readHistory();
		resetTable();
		addHistory();
	} else {
		getCompanies($.companyTF.value, {
			success: function(e) {
				Ti.API.info('Recieved data = '+e);
				loadTable(e);
			},
			error: function(e) {
				Ti.API.info('Error = '+e);
				alert("No network or server not available. Please try again.");
			}
		});	
	}
});

function loadTable(e) {
	Ti.API.info("index: loadTable()");
	
	var reply = JSON.parse(e);
    var rows = [];
    var i = 0;
    
    Ti.API.info("index: reply = "+reply);
    
    if(reply.length>0){
        
        _.each(reply, function(item) {
        		rows.push(Alloy.createController('companyRow', {
				name: item.Name,
				symbol: item.Symbol,
			}).getView());
		});
    
	}
	else {
		alert("No companies found.");
	}
	
	$.companyTV.setData(rows);
	addHistory();
}

function getCompanies(text, o){
	Ti.API.info("getCompanies() - text = "+text);
	
	if(Titanium.Network.networkType == Titanium.Network.NETWORK_NONE){
		Ti.API.info("markit: ondemand() - No Network");
		if (o.error) { o.error("No Network"); };
		return;
	}
	
	var xhr = Titanium.Network.createHTTPClient({
		onload: function() {
			if (o.success) { o.success(this.responseText); };		
		},
		onerror: function(e) {
			if (o.error) { o.error("Error with markitOnDemand API"); };
		},
		timeout: 10000,
	});
	
	xhr.open("GET", "http://dev.markitondemand.com/Api/Lookup/json?input="+text);
	xhr.send();
};

$.index.open();

$.companyTF.blur();

ACSLogin("a","1234",{
	success: function(e) {
		Ti.API.info('ACSLogin success');
		readHistory();
	},
	error: function(e) {
		Ti.API.info(e);
		Ti.API.info('ACSLogin failure');
	}
});