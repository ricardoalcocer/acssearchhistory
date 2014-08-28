var args = arguments[0] || {};

//Ti.API.info("row created, args.name = "+args.name);

$.companyRow.name = args.name;
$.companyRow.symbol = args.symbol;
$.companyRow.history = args.history;

$.companyLbl.text = args.name;
$.symbolLbl.text = args.symbol;

if(args.history) {
	$.companyLbl.color="red";
	$.symbolLbl.color="red";
};
