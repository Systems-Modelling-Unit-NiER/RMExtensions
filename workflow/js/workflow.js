var stati = ["State (Workflow Hazard)","State (Workflow Contromisura)","State (Workflow Requisito sistema)","State (Workflow Requisito sottosistema)","State (Workflow Requisito software)","State (Workflow Requisito hardware)"];
var initialize = true;

function version()
{
	window.alert("prova 12");
	initialize=false;
}

function println(string,element) {
	var p = document.createElement("p");
	p.innerHTML = string;
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
var typeChanged = [];
var idChanged = [];
var idError = [];
var urlChanged = [];
var type = "";

var steps = true;
var numEl;
var numTot;

function isequal(string)
{
	return string == equal;
}

function updateStatus(item,string)
{
	var name = item.values[RM.Data.Attributes.ARTIFACT_TYPE].name;
	if (name.startsWith("Hazard ")) name = "Hazard";
	if (item.values["State (Workflow " + name + ")"] != string)
	{
		item.values["State (Workflow " + name + ")"] = string;
		numChanged++;
		typeChanged.push(item.values[RM.Data.Attributes.ARTIFACT_TYPE].name);
		idChanged.push(parseInt(item.values[RM.Data.Attributes.IDENTIFIER]));
		urlChanged.push(item.ref.toUri());
		toSave.push(item);
	}
}

function updateReqStatus(item)
{
	return new Promise(resolve1 => {
		if (type.startsWith("Requisito ")) {$("#updates").empty(); println("Esaminando requisito " + numEl + "/" + numTot + "...","updates"); modified = modified + "<tr>";}
		//else println("Aggiornamento status requisiti...","updates");
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
			if(artifactIndex.length == 0)
			{
				if(steps) modified = modified + "<td><a href=\"" + item.ref.toUri() + "\" target=\"_blank\">" + item.values[RM.Data.Attributes.IDENTIFIER] + "</td></tr>";
                else modified = modified + "<td><a href=\"" + item.ref.toUri() + "\" target=\"_blank\">" + item.values[RM.Data.Attributes.IDENTIFIER] + "</td></tr>";
				resolve1();
			}
			RM.Data.getAttributes(artifactIndex, [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.ARTIFACT_TYPE,"Esito"], function(attrResult) {
				//window.alert("length: " + attrResult.data.length);
				modified = modified + "<td><a href=\"" + item.ref.toUri() + "\" target=\"_blank\">" + item.values[RM.Data.Attributes.IDENTIFIER] + "</a></td></tr>";
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
					println("Salvataggio in corso...","updates");
					RM.Data.setAttributes(toSave, function(result2){
						if(result2.code !== RM.OperationResult.OPERATION_OK)
						{
							window.alert("Error req " + item.values[RM.Data.Attributes.IDENTIFIER] + ": " + result2.code);
							idError.push(parseInt(item.values[RM.Data.Attributes.IDENTIFIER]));
						}
						finalstate = item.values["State (Workflow " + item.values[RM.Data.Attributes.ARTIFACT_TYPE].name + ")"];
						toSave = [];
						resolve1(finalstate);
					});
				}
				else resolve1(finalstate);
				//println("Completato","result");
				//window.alert("resolved");
			});
		});
	});
}

async function updateCmStatus(item)
{
	return new Promise(resolve2 => {
		var linkedStat = [];
		if (type == "Contromisura") {$("#updates").empty(); println("Esaminando contromisura " + numEl + "/" + numTot + "...","updates"); modified = modified + "<tr>";}
		//else println("Aggiornamento status contromisure...","updates");
		//window.alert("opening: " + item.values[RM.Data.Attributes.IDENTIFIER]);
		RM.Data.getLinkedArtifacts(item.ref, async function(linksResult) {
			var artifactIndex = [];
			linksResult.data.artifactLinks.forEach(function(linkDefinition) {
			linkDefinition.targets.forEach(function(ref) {
				indexArtifact(artifactIndex, ref);
				});
			});
			//window.alert("link number: " + artifactIndex.length);
			if(artifactIndex.length == 0)
			{
				if(steps) modified = modified + "<td><a href=\"" + item.ref.toUri() + "\" target=\"_blank\">" + item.values[RM.Data.Attributes.IDENTIFIER] + "</td><td></td></tr>";
				else modified = modified + "<td><a href=\"" + item.ref.toUri() + "\" target=\"_blank\">" + item.values[RM.Data.Attributes.IDENTIFIER] + "</td></tr>";
				resolve2();
			}
			RM.Data.getAttributes(artifactIndex, [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.ARTIFACT_TYPE,"State (Workflow Requisito sistema)","State (Workflow Requisito sottosistema)","State (Workflow Requisito software)","State (Workflow Requisito hardware)"], async function(attrResult) {
				//window.alert("length: " + attrResult.data.length);
				var n = 0;
				if(!steps) modified = modified + "<td><a href=\"" + item.ref.toUri() + "\" target=\"_blank\">" + item.values[RM.Data.Attributes.IDENTIFIER] + "</a></td>";
				for(item2 of attrResult.data)
				{
					var linkedtype = item2.values[RM.Data.Attributes.ARTIFACT_TYPE].name;
					//window.alert("Linked type: " + linkedtype);
					if (linkedtype.startsWith("Requisito ") && linkedtype != "Requisito input")
					{
						n++;
						if(steps)
						{
							if (n>1) modified = modified + "<tr><td></td><td></td>";
							else modified = modified + "<td><a href=\"" + item.ref.toUri() + "\" target=\"_blank\">" + item.values[RM.Data.Attributes.IDENTIFIER] + "</a></td>";
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
					println("Salvataggio in corso...","updates");
					RM.Data.setAttributes(toSave, function(result2){
						if(result2.code !== RM.OperationResult.OPERATION_OK)
						{
							window.alert("Error cm " + item.values[RM.Data.Attributes.IDENTIFIER] + ": " + result2.code);
							idError.push(parseInt(item.values[RM.Data.Attributes.IDENTIFIER]));
						}
						toSave = [];
						finalstate = item.values["State (Workflow Contromisura)"];
						resolve2(finalstate);
					});
				}
				else resolve2(finalstate);
				//println("Completato","result");
				//window.alert("resolved");
			});
		});
	});
}

async function updateHzStatus(item)
{
	return new Promise(resolve3 => {
		$("#updates").empty();
		println("Esaminando hazard " + numEl + "/" + numTot + "...","updates");
		var linkedStat = [];
		//window.alert("opening: " + item.values[RM.Data.Attributes.IDENTIFIER]);
		RM.Data.getLinkedArtifacts(item.ref, async function(linksResult) {
			var artifactIndex = [];
			linksResult.data.artifactLinks.forEach(function(linkDefinition) {
			linkDefinition.targets.forEach(function(ref) {
				indexArtifact(artifactIndex, ref);
				});
			});
			if(artifactIndex.length == 0)
			{
                if(steps) modified = modified + "<tr><td><a href=\"" + item.ref.toUri() + "\" target=\"_blank\">" + item.values[RM.Data.Attributes.IDENTIFIER] + "</td><td></td><td></td></tr>"
                else modified = modified + "<tr><td><a href=\"" + item.ref.toUri() + "\" target=\"_blank\">" + item.values[RM.Data.Attributes.IDENTIFIER] + "</td></tr>";
				resolve3();
			}
			RM.Data.getAttributes(artifactIndex, [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.ARTIFACT_TYPE, "State (Workflow Contromisura)"], async function(attrResult) {
				var n = 0;
				if(!steps) modified = modified + "<tr><td><a href=\"" + item.ref.toUri() + "\" target=\"_blank\">" + item.values[RM.Data.Attributes.IDENTIFIER] + "</a></td></tr>";
				for(item2 of attrResult.data)
				{
					var linkedtype = item2.values[RM.Data.Attributes.ARTIFACT_TYPE].name;
					if (linkedtype == "Contromisura")
					{
						n++;
						if(steps)
						{
							if (n>1) modified = modified + "<tr><td></td>";
							else modified = modified + "<tr><td><a href=\"" + item.ref.toUri() + "\" target=\"_blank\">" + item.values[RM.Data.Attributes.IDENTIFIER] + "</a></td>";
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
				var finalstate = "";
				finalstate = item.values["State (Workflow Hazard)"];
				if (toSave.length > 0)
				{
					println("Salvataggio in corso...","updates");
					RM.Data.setAttributes(toSave, function(result2){
						if(result2.code !== RM.OperationResult.OPERATION_OK)
						{
							window.alert("Error hz " + item.values[RM.Data.Attributes.IDENTIFIER] + ": " + result2.code);
							idError.push(parseInt(item.values[RM.Data.Attributes.IDENTIFIER]));
						}
						toSave = [];
						finalstate = item.values["State (Workflow Hazard)"];
						resolve3(finalstate);
					});
				}
				else resolve3(finalstate);
				//println("Completato","result");
				//window.alert("resolved");
			});
		});
	});
}

$(async function()
{
	$("#tabResults").empty();
	//if (initialize==true) version();
	var selection = [];
	var docName = "";
	println("Entrare in un modulo per aggiornare gli status","intro");
	RM.Event.subscribe(RM.Event.ARTIFACT_OPENED, function(selected) {
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
		modified = "";
		numEl = 0;
		if($("#steps").prop('checked')) steps = true;
		else steps = false;
		//window.alert(steps);
		RM.Data.getContentsAttributes(selection, stati.concat([RM.Data.Attributes.ARTIFACT_TYPE,RM.Data.Attributes.IDENTIFIER]), async function(result1){
			//window.alert(result1.data.length);
			var i;
			numTot = result1.data.length;
			for(item of result1.data)
			{
				numEl++;
				type = item.values[RM.Data.Attributes.ARTIFACT_TYPE].name;
				if (modified === "")
				{
					if($("#steps").prop('checked') && type.startsWith("Hazard ")) modified = "<thead><tr><th>Hazard</th><th>Contromisure</th><th>Requisiti</th></tr></thead><tbody>";
					else if ($("#steps").prop('checked') && type == "Contromisura") modified = "<thead><tr><th>Contromisure</th><th>Requisiti</th></tr></thead><tbody>";
					else if (type.startsWith("Requisito ")) modified = "<thead><tr><th>Requisiti</th></tr></thead><tbody>";
					else if (type == "Contromisura") modified = "<thead><tr><th>Contromisure</th></tr></thead><tbody>";
					else if (type.startsWith("Hazard ")) modified = "<thead><tr><th>Hazard</th></tr></thead><tbody>";
				}
				modified = modified.replace("</tr></tbody>","</tr>");
				//console.log(modified)
				//window.alert("Tipo :" + type);
				if (type.startsWith("Requisito ") && type != "Requisito input")
				{
					await updateReqStatus(item);
				}
				else if (type == "Contromisura")
				{
					await updateCmStatus(item);
				}
				else if (type.startsWith("Hazard "))
				{
					await updateHzStatus(item);
				}
				modified =  modified + "</tbody>";
				$("#tabResults").empty();
				//console.log(modified)
				$("#tabResults").append(modified);
			}
			for(i=0;i<idChanged.length;i++)
			{
				modified = modified.replaceAll(idChanged[i],"<mark>" + idChanged[i] + "</mark>");
			}
			var numErrors = new Set(idError).size;
			for(i=0;i<idError.length;i++)
			{
				modified = modified.replaceAll("<mark>" + idError[i] + "</mark>","<span style=\"background-color: #FF0000\">" + idError[i] + "</span>");
			}
			$("#updates").empty();
			println("In evidenza gli artefatti modificati (" + numChanged + ", con " + numErrors + " errori):","updates");
			$("#tabResults").empty();
			$("#tabResults").append(modified);
			//window.alert(toSave.length);
		});
	});
});
