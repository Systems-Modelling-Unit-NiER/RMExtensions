var stati = ["State (Workflow Hazard)","State (Workflow Contromisura)","State (Workflow Requisito sistema)","State (Workflow Requisito sottosistema)","State (Workflow Requisito software)","State (Workflow Requisito hardware)"];
var initialize = true;

function version()
{
	window.alert("prova 7");
	initialize=false;
}

function println(string, element, id = null) {
	var p = document.createElement("p");
	p.innerHTML = string;
	if (id != null) p.id = id;
	$(p).appendTo("#"+element);
};

function indexArtifact(/*RM.ArtifactRef[]*/ refs, /*RM.ArtifactRef*/ ref) {
	// Summary: Maintains a non-duplicating array of RM.ArtifactRef objects.
	var refPresent = false;
	for (var i = 0; i < refs.length; i++) {
		if (refs[i].equals(ref)) {
			refPresent = true;
		}
	}
	if (!refPresent) {
		refs.push(ref);
	}
};

var equal = "";
var toSave = [];
var numChanged = 0;
var idChanged = [];
var urlChanged = [];
var type = "";
var modified = "";
var steps = true;
var missingArtifacts = 0;

function isequal(string)
{
	return string == equal;
}

function updateStatus(item,string)
{
	var name = item.values[RM.Data.Attributes.ARTIFACT_TYPE].name;
	if (name.startsWith("Hazard ")) name = "Hazard";
	item.values["State (Workflow " + name + ")"] = string;
	modified = string;
	numChanged++;
	idChanged.push(parseInt(item.values[RM.Data.Attributes.IDENTIFIER]));
	urlChanged.push(item.ref.toUri());
	toSave.push(item);
}

function writeResults()
{
	var i;
	var modified = "";
	for(i=0;i<idChanged.length;i++)
	{
		modified = modified + "</br><a href=\"" + urlChanged[i] + "\" target=\"_blank\">" + idChanged[i] + "</a>";
	}
	$("#result").empty();
	println("I seguenti " + numChanged + " artefatti sono stati aggiornati:" + modified,"result");
	//window.alert(toSave.length);
}

function updateReqStatus(item, hzid = null, cmid = null)
{
	return new Promise(resolve1 => {
		if (type.startsWith("Requisito ")) {$("#result").empty(); println("Aggiornamento status requisito " + item.values[RM.Data.Attributes.IDENTIFIER] + "...","result");}
		else println("Aggiornamento status requisiti...","result");
		var linkedStat = [];
		//window.alert("opening: " + item.values[RM.Data.Attributes.IDENTIFIER]);
		RM.Data.getLinkedArtifacts(item.ref, function(linksResult) {
			var artifactIndex = [];
			linksResult.data.artifactLinks.forEach(function(linkDefinition) {
			linkDefinition.targets.forEach(function(ref) {
				indexArtifact(artifactIndex, ref);
				});
			});
			//window.alert("link number: " + artifactIndex.length);
			if(artifactIndex.length == 0) resolve1();
			RM.Data.getAttributes(artifactIndex, [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.ARTIFACT_TYPE,"Esito"], function(attrResult) {
				//window.alert("length: " + attrResult.data.length);
				for(item2 of attrResult.data)
				{
					var linkedtype = item2.values[RM.Data.Attributes.ARTIFACT_TYPE].name;
					//window.alert("Linked type: " + linkedtype);
					if (linkedtype == "Test")
					{
						//window.alert("Req : " + item2.values["Esito"]);
						linkedStat.push(item2.values["Esito"]);
					}
				}
				equal = "Passato";
				if(linkedStat.length > 0 && linkedStat.every(isequal) && (item.values["State (Workflow " + item.values[RM.Data.Attributes.ARTIFACT_TYPE].name + ")"] == "Obsoleto" || item.values["State (Workflow " + item.values[RM.Data.Attributes.ARTIFACT_TYPE].name + ")"] == "Propagato" || ((linkedtype == "Requisito software" || linkedtype == "Requisito hardware") && item.values["State (Workflow " + item.values[RM.Data.Attributes.ARTIFACT_TYPE].name + ")"] == "Caratterizzato")))
				{
					//window.alert("modified " + item.values[RM.Data.Attributes.IDENTIFIER]);
					updateStatus(item,"Validato");
				}
				var finalstate = "";
				finalstate = item.values["State (Workflow " + item.values[RM.Data.Attributes.ARTIFACT_TYPE].name + ")"];
				if (toSave.length > 0)
				{
					println("Salvataggio in corso...","result");
					RM.Data.setAttributes(toSave, function(result2){
						if(result2.code !== RM.OperationResult.OPERATION_OK)
						{
							window.alert("Error for req. " + item.values[RM.Data.Attributes.IDENTIFIER] + ": " + result2.code);
						}
						finalstate = item.values["State (Workflow " + item.values[RM.Data.Attributes.ARTIFACT_TYPE].name + ")"];
						toSave = [];
						if (type.startsWith("Requisito ")) --missingArtifacts;
						if (missingArtifacts <= 0) writeResults();
						resolve1(finalstate);
					});
				}
				else
				{
					if (type.startsWith("Requisito ")) --missingArtifacts;
					if (missingArtifacts <= 0) writeResults();
					resolve1(finalstate);
				}
				if (missingArtifacts <= 0) writeResults();
			});
		});
	});
}

async function updateCmStatus(item, hzid = null)
{
	return new Promise(resolve2 => {
		var linkedStat = [];
		if (type == "Contromisura") {$("#result").empty(); println("Aggiornamento status contromisura " + item.values[RM.Data.Attributes.IDENTIFIER] + "...","result");}
		else println("Aggiornamento status contromisure...","result");
		//window.alert("opening: " + item.values[RM.Data.Attributes.IDENTIFIER]);
		RM.Data.getLinkedArtifacts(item.ref, async function(linksResult) {
			var artifactIndex = [];
			linksResult.data.artifactLinks.forEach(function(linkDefinition) {
			linkDefinition.targets.forEach(function(ref) {
				indexArtifact(artifactIndex, ref);
				});
			});
			//window.alert("link number: " + artifactIndex.length);
			if(artifactIndex.length == 0) resolve2();
			RM.Data.getAttributes(artifactIndex, [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.ARTIFACT_TYPE,"State (Workflow Requisito sistema)","State (Workflow Requisito sottosistema)","State (Workflow Requisito software)","State (Workflow Requisito hardware)"], async function(attrResult) {
				//window.alert("length: " + attrResult.data.length);
				for(item2 of attrResult.data)
				{
					var linkedtype = item2.values[RM.Data.Attributes.ARTIFACT_TYPE].name;
					//window.alert("Linked type: " + linkedtype);
					if (linkedtype.startsWith("Requisito ") && linkedtype != "Requisito input")
					{
						if(steps)
						{
							var saved = await updateReqStatus(item2);
							linkedStat.push(saved);
						}
						else linkedStat.push(item2.values["State (Workflow " + item2.values[RM.Data.Attributes.ARTIFACT_TYPE].name + ")"]);
					}
				}
				equal = "Validato";
				if(linkedStat.length > 0 && linkedStat.every(isequal) && item.values["State (Workflow Contromisura)"] == "Coperto")
				{
					updateStatus(item,"Chiuso");
				}
				else if(linkedStat.length > 0 && item.values["State (Workflow Contromisura)"] != "Chiuso")
				{
					updateStatus(item,"Coperto");
				}
				var finalstate = "";
				finalstate = item.values["State (Workflow Contromisura)"];
				if (toSave.length > 0)
				{
					println("Salvataggio in corso...","result");
					RM.Data.setAttributes(toSave, function(result2){
						if(result2.code !== RM.OperationResult.OPERATION_OK)
						{
							window.alert("Error for cm. " + item.values[RM.Data.Attributes.IDENTIFIER] + ": " + result2.code);
						}
						toSave = [];
						finalstate = item.values["State (Workflow Contromisura)"];
						if (type == "Contromisura") --missingArtifacts;
						if (missingArtifacts <= 0) writeResults();
						resolve2(finalstate);
					});
				}
				else
				{
					if (type == "Contromisura") --missingArtifacts;
					if (missingArtifacts <= 0) writeResults();
					resolve2(finalstate);
				}
				//println("Completato","result");
				//window.alert("resolved");
			});
		});
	});
}

async function updateHzStatus(item)
{
	return new Promise(resolve3 => {
		var linkedStat = [];
		$("#result").empty();
		println("Aggiornamento status hazard " + item.values[RM.Data.Attributes.IDENTIFIER] + "...","result");
		//window.alert("opening: " + item.values[RM.Data.Attributes.IDENTIFIER]);
		RM.Data.getLinkedArtifacts(item.ref, async function(linksResult) {
			var artifactIndex = [];
			linksResult.data.artifactLinks.forEach(function(linkDefinition) {
			linkDefinition.targets.forEach(function(ref) {
				indexArtifact(artifactIndex, ref);
				});
			});
			if(artifactIndex.length == 0) resolve3();
			RM.Data.getAttributes(artifactIndex, [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.ARTIFACT_TYPE, "State (Workflow Contromisura)"], async function(attrResult) {
				for(item2 of attrResult.data)
				{
					var linkedtype = item2.values[RM.Data.Attributes.ARTIFACT_TYPE].name;
					if (linkedtype == "Contromisura")
					{
						if(steps)
						{
							var saved = await updateCmStatus(item2);
							linkedStat.push(saved);
						}
						else linkedStat.push(item2.values["State (Workflow Contromisura)"]);
					}
				}
				equal = "Chiuso";
				if(linkedStat.length > 0 && linkedStat.every(isequal) && (item.values["State (Workflow Hazard)"] == "Obsoleto" || item.values["State (Workflow Hazard)"] == "Risolto"))
				{
					updateStatus(item,"Chiuso");
				}
				else if(linkedStat.length > 0 && item.values["State (Workflow Hazard)"] != "Chiuso")
				{
					//window.alert("Risolto");
					updateStatus(item,"Risolto");
				}
				println("Completato","result");
				var finalstate = "";
				finalstate = item.values["State (Workflow Hazard)"];
				if (toSave.length > 0)
				{
					println("Salvataggio in corso...","result");
					RM.Data.setAttributes(toSave, function(result2){
						if(result2.code !== RM.OperationResult.OPERATION_OK)
						{
							window.alert("Error for hz. " + item.values[RM.Data.Attributes.IDENTIFIER] + ": " + result2.code);
						}
						toSave = [];
						finalstate = item.values["State (Workflow Hazard)"];
						if (type.startsWith("Hazard ")) --missingArtifacts;
						if (missingArtifacts <= 0) writeResults();
						resolve3(finalstate);
					});
				}
				else
				{
					if (type.startsWith("Hazard ")) --missingArtifacts;
					if (missingArtifacts <= 0) writeResults();
					resolve3(finalstate);
				}
				//println("Completato","result");
				//window.alert("resolved");
			});
		});
	});
}

$(async function()
{
	if (initialize==true) version();
	var selection = [];
	var docName = "";
	println("Entrare in un modulo per aggiornare gli status","intro");
	RM.Event.subscribe(RM.Event.ARTIFACT_OPENED, function(selected) {
		$("#result").empty();
		selection = selected;
		RM.Data.getAttributes(selection, [RM.Data.Attributes.NAME,RM.Data.Attributes.FORMAT], function(result){			
			result.data.forEach(function(item){
				if (item.values[RM.Data.Attributes.FORMAT] === RM.Data.Formats.MODULE)
				{
					$("#intro").empty();
					println("Modulo: <b>"+item.values[RM.Data.Attributes.NAME]+"</b><br/><br/><small>Se si effettuano modifiche, uscire e rientrare nel modulo prima di ricalcolare.</small>","intro");
					docName=item.values[RM.Data.Attributes.NAME]+"_";
				}
			});
		});
	});
	
	$("#SetStatus").on("click", async function() {
		if($("#steps").prop('checked')) steps = true;
		else steps = false;
		//window.alert(steps);
		RM.Data.getContentsAttributes(selection, stati.concat([RM.Data.Attributes.ARTIFACT_TYPE,RM.Data.Attributes.IDENTIFIER]), async function(result1){
			missingArtifacts = result1.data.length;
			for(item of result1.data)
			{
				type = item.values[RM.Data.Attributes.ARTIFACT_TYPE].name;
				//window.alert("Tipo :" + type);
				if (type.startsWith("Requisito ") && type != "Requisito input")
				{
					updateReqStatus(item);
				}
				else if (type == "Contromisura")
				{
					updateCmStatus(item);
				}
				else if (type.startsWith("Hazard "))
				{
					updateHzStatus(item);
				}
				//window.alert("loop");
			}
		});
	});
});
