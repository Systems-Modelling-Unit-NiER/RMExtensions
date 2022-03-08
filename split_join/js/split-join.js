/*
 Licensed Materials - Property of IBM
 import-repair.js
 © Copyright IBM Corporation 2014
U.S. Government Users Restricted Rights:  Use, duplication or disclosure restricted by GSA ADP Schedule 
Contract with IBM Corp. 
*/

/* Given a module with artifacts containing text content either join selected artifacts together into a 
 * single artifact, or split a single artifact with multiple paragraphs into multiple artifacts in the 
 * module.  It is not recommended to try splitting or joining artifacts with non-text content, artifacts
 * of different types or artifacts at different levels in the module hierarchy, although the extension
 * will make a best effort attempt in those cases.
 * 
 * In the case of the join function the first artifact selected is the one that is preserved and had the
 * text of the other artifacts merged into it.  Once that has occurred, the other artifacts are deleted.
 * 
 * In the case of the split function, the text of the artifact is split along paragraph boundaries and the
 * new artifacts are created after the initial artifact.  The initial artifact is preserved to hold the
 * first paragraph content and new artifacts are created for the subsequent paragraphs.
 * 
 */

var initialize = true;
var counter = 0;
function version()
{
	window.alert("prova 15");
	initialize=false;
}

/* Helper function for simple output */
function println(string) {
	var p = document.createElement("p");
	p.innerHTML = string;
	$(p).appendTo("#result");
}

function extractContent(s) {
	var span = document.createElement('span');
	span.innerHTML = s;
	return span.textContent || span.innerText;
}

/* Creates a single, joined block of text from the RM.Data.Attributes.PRIMARY_TEXT contents of the selected
 * artifacts to send to the server.
 */
function constructJoined(artifactAttributes, attrName) {
	var newText = "";
	var theMax = -1;
	var theMin = -1;
	
	//var it = 0
	//window.alert("length: " artifactAttributes.length);
	artifactAttributes.forEach(function(aa) {
		//it++;
		var aaText = aa.values[attrName];
		//window.alert(it + " old: " + aaText + "new: " + newText);
		var identifier = parseInt(aa.values[RM.Data.Attributes.IDENTIFIER]);
		if (aaText) {
			if(theMax == -1 && theMin == -1) {newText = newText + aaText; theMax = identifier; theMin = identifier;}
			else if(identifier > theMax) {newText = (((newText+"")=="" || (aaText+"")=="")? newText : newText+"\n") + aaText; theMax = identifier;}
			else if(identifier < theMin) {newText = (((newText+"")=="" || (aaText+"")=="")? aaText : aaText+"\n") + newText; theMin = identifier;}
			else {newText = newText + aaText;}
			//window.alert(newText);
		} else {
			// Error handling
		}
	});
	
	return newText;
};

async function join(artifacts) {
	return new Promise(resolve1 => {
		var localselection = artifacts;
		RM.Data.getAttributes(localselection, async function (attrResult) {
			if (attrResult.code === RM.OperationResult.OPERATION_OK) {
				var artifactAttributes = attrResult.data;
				if (artifactAttributes) {
					operationInProgress = true;
					var numattr = 0;
					var attrNames = [];
					var keys = [];
					var item = attrResult.data[0];
					for (var key in item.values)
					{
						keys.push(key);
						numattr++;
					}
					RM.Data.getValueRange(localselection[0], keys, async function(valResult)
					{
						var toSave = [];
						var joinedText = [];
						var toSkip = [];
						if (valResult.code != RM.OperationResult.OPERATION_OK)
						{
							return;
						}
						for (var i = 0; i < numattr; i++)
						{
							toSkip[i] = false;
							// Collect the information for each attribute in turn.
							attrNames[i] = valResult.data[i].attributeKey;
							var construct = constructJoined(artifactAttributes,attrNames[i]);
							if(valResult.data[i].multiValued) construct = construct.replace(/\n/g, ",");
							var lines = construct.split("\n");
							if(valResult.data[i].valueType !== RM.Data.ValueTypes.ENUMERATION) joinedText[i] = construct;
							else if((construct+"")!="") joinedText[i] = lines[0];
							else toSkip[i] = true;
						};
						//insert only the attributes which can be joined
						var firstChoice = artifactAttributes.shift();
						var newTextValues = new RM.ArtifactAttributes(firstChoice.ref);
						for (var i = 0; i < numattr; i++)
						{
							if(attrNames[i] != "http://purl.org/dc/terms/creator"
							   && attrNames[i] != "http://purl.org/dc/terms/created"
							   && attrNames[i] != "http://purl.org/dc/terms/contributor"
							   && attrNames[i] != "http://purl.org/dc/terms/modified"
							   && attrNames[i] != "http://www.ibm.com/xmlns/rdm/types/ArtifactFormat"
							   && attrNames[i] != "http://purl.org/dc/terms/identifier"
							   && attrNames[i] != "http://www.ibm.com/xmlns/rdm/rdf/depth"
							   && attrNames[i] != "http://www.ibm.com/xmlns/rdm/rdf/section"
							   && attrNames[i] != "http://www.ibm.com/xmlns/rdm/rdf/module"
							   && attrNames[i] != "http://www.ibm.com/xmlns/rdm/rdf/isHeading"
							   && attrNames[i] != "http://www.ibm.com/xmlns/rdm/types/AlternateSpelling"
							   && !(attrNames[i].startsWith("State (Workflow "))
							   && !toSkip[i]) newTextValues.values[attrNames[i]] = (valResult.data[i].multiValued)?(joinedText[i].split(",")):(joinedText[i]);
						}
						println("Joining all selected text into first artifact");
						RM.Data.setAttributes(newTextValues, async function(setResult) {
							if (setResult.code === RM.OperationResult.OPERATION_OK) {
								// Remove the leftover artifacts
								var targetCount = 0;
								// Use a recursive delete function to delete however many artifacts are left
								// over from the join operation, while waiting for each individual deletion
								// to complete before starting the next one
								var removeSequence = async function() {
									return new Promise(resolve2 => {
										if (artifactAttributes[targetCount]) {
											RM.Data.Module.removeArtifact(artifactAttributes[targetCount].ref, 
													true, async function(removeResult) {
												if (removeResult.code === RM.OperationResult.OPERATION_OK) {
													targetCount++;
													await removeSequence();
												} else {
													println("Unable to remove joined artifact, aborting join operation.");
													operationInProgress = false;
												}
												resolve2();
											});
										} else {
											println("The first artifact that you selected now contains the contents of " 
													+ "the other selected artifacts. The other artifacts were removed.");
											println("The artifacts were joined.");
											operationInProgress = false;
											resolve2();
										}
									});
								};
								println("Removing leftover artifacts after joining their content.");
								// Start the sequence of deletions
								await removeSequence();
							} else {
								println("Unable to join content into first artifact, aborting join operation. ");
								operationInProgress = false;
							}
							counter++;
							resolve1();
						});
					});

				}
			}
		});
	});
};

/* Main Operating Function */

$(async function() {
	
	//if (initialize==true) version();
	
	// this function is run when the document is ready.
	
	var selection = [];
	var captionpairs = [];
	var thisdoc = null;
	var total = 0;
	
	// Tracks whether or not to update selection messages while an operation is performed.  Otherwise,
	// as the selection changed with the creation or deletion of artifacts the information displayed in
	// the extension would update unnecessarily.
	var operationInProgress = false;
	
	RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, function(selected) {
		$("#result").empty();
		selection = selected;
		if (!operationInProgress) {
			// Get the type of the initial selected artifact to make it clear what is being operated on.
			RM.Data.getAttributes(selection[0], [RM.Data.Attributes.ARTIFACT_TYPE], function (attrResult) {
				if (attrResult.code === RM.OperationResult.OPERATION_OK) {
					var artifactAttributes = attrResult.data;
					var rootType = attrResult.data[0].values[RM.Data.Attributes.ARTIFACT_TYPE].name;
					if (selected.length > 1) {
						println(selected.length + " objects ready to join, ordered according to the identifier.");
						println("Artifact type of the result: " + rootType);
					} else if (selected.length === 1) {
						println("Ready to split into component artifacts.");
					}
				} else {
					println("No artifacts selected.");
				}
			});
		}
	});
	
	RM.Event.subscribe(RM.Event.ARTIFACT_OPENED, function(opened) {
		RM.Data.getAttributes(opened, [RM.Data.Attributes.NAME,RM.Data.Attributes.FORMAT], function(result){			
			result.data.forEach(function(item){
				if (item.values[RM.Data.Attributes.FORMAT] === RM.Data.Formats.MODULE)
				{
					thisdoc = opened;
				}
			});
		});
	});
	
	$("#splitArtifact").on("click", function() {
		// Get the necessary information for the split from the initial artifact.
		RM.Data.getAttributes(selection[0], [RM.Data.Attributes.PRIMARY_TEXT, RM.Data.Attributes.ARTIFACT_TYPE,
		                                     RM.Data.Attributes.IS_HEADING], 
				function (attrResult) {
			if (attrResult.code === RM.OperationResult.OPERATION_OK) {
				var artifactAttributes = attrResult.data[0];
				if (artifactAttributes) {
					// retrieve the values we requested
					var existingText = artifactAttributes.values[RM.Data.Attributes.PRIMARY_TEXT];
					var existingType = artifactAttributes.values[RM.Data.Attributes.ARTIFACT_TYPE];
					var isHeading = artifactAttributes.values[RM.Data.Attributes.IS_HEADING];
					// Use regex to split the existing text in the artifact into separate paragraphs.
					var paragraphs = existingText.match(/<p.+<\/p>/gi);
					
					if (paragraphs.length <= 1) {
						println("No paragraph boundaries to split along detected, aborting split operation.");
						return;
					}
					
					println("The artifact will be split into " + paragraphs.length + " artifacts ...");
					operationInProgress = true;
					// Set the content in the first artifact as the first of the split artifacts
					var paragraph = paragraphs.shift();
					var newTextValues = new RM.ArtifactAttributes(selection[0]);
					newTextValues.values[RM.Data.Attributes.PRIMARY_TEXT] = paragraph;
					println("Artifact content is being joined in the first artifact that you selected...");
					RM.Data.setAttributes(newTextValues, function(setResult) {
						if (setResult.code === RM.OperationResult.OPERATION_OK) {
							// Recursive sequence to create the artifacts to hold the newly split paragraphs
							var createSequence = function(previousRef) {
								// Check that we have further paragraphs to continue processing, and also remove
								// the one we are about to process from the list if we do.
								if (paragraph = paragraphs.shift()) {
									// Determine the values to create the new artifact with
									var newValues = new RM.AttributeValues;
									newValues[RM.Data.Attributes.PRIMARY_TEXT] = paragraph;
									newValues[RM.Data.Attributes.ARTIFACT_TYPE] = existingType.name;
									newValues[RM.Data.Attributes.IS_HEADING] = isHeading;
									var strategy = new RM.LocationSpecification(previousRef, 
											RM.Data.PlacementStrategy.AFTER);
									
									RM.Data.Module.createArtifact(newValues, strategy, 
											function(createResult) {
										if (createResult.code === RM.OperationResult.OPERATION_OK) {
											var newRef = createResult.data;
											createSequence(newRef);
										} else {
											println("Unable to create split artifact, aborting split" + 
											" operation.");
											operationInProgress = false;
										}
									});
								} else {
									println("All of the new artifacts were added to the module.");
									println("The artifact was split.");
									operationInProgress = false;
								}
							};
							println("Artifacts are being created as a result of the split...");
							// Start the sequence of creations
							createSequence(selection[0]);
						}
					});
				}
			}
		});
	});
	
	$("#joinArtifacts").on("click", function() {
		join(selection);
	});
	
	$("#joinCaptions").on("click", async function() {
		counter = 0;
		total = 0;
		if(thisdoc === null)
		{
			window.alert("Nessun modulo selezionato. Provare a uscire e rientrare");
			return;
		}
		captionpairs = [];
		println("Inspecting module...");
		RM.Data.getContentsAttributes(thisdoc, [RM.Data.Attributes.ARTIFACT_TYPE, RM.Data.Attributes.FORMAT, RM.Data.Attributes.PRIMARY_TEXT], async function(result) {
			var i;
			for(i = 0; i < result.data.length; i++)
			{
				var txt = extractContent(result.data[i].values[RM.Data.Attributes.PRIMARY_TEXT]).replace('\xA0',' ').replace('\n','');
				var htmltxt = result.data[i].values[RM.Data.Attributes.PRIMARY_TEXT];
				//if(i<17) window.alert(txt + txt.startsWith("Tabel"));
				/*if((txt.startsWith("Tabella ") || txt.startsWith("Figura ")) && !(htmltxt.includes("<table ") || htmltxt.includes("<img ")) && !(result.data[i].values[RM.Data.Attributes.ARTIFACT_TYPE].name.includes("Intestazione")))
				{
					var ii = i-1;
					while(!result.data[ii].values[RM.Data.Attributes.PRIMARY_TEXT].includes("<img ") && !result.data[ii].values[RM.Data.Attributes.PRIMARY_TEXT].includes("<table ")) ii--;
					captionpairs.push(result.data[ii].ref,result.data[i].ref);
				}*/
				if(txt.startsWith("Tabella ") && !htmltxt.includes("<table ") && !(result.data[i].values[RM.Data.Attributes.ARTIFACT_TYPE].name.includes("Intestazione")))
				{
					total++;
					var ii = i-1;
					while(!result.data[ii].values[RM.Data.Attributes.PRIMARY_TEXT].includes("<table ")) ii--;
					window.alert("Tabella " + txt.replace( /(^.+\D)(\d+)(\D.+$)/i,'$2'));
					window.alert(result.data[ii-1].values[RM.Data.Attributes.PRIMARY_TEXT]);
					window.alert((result.data[ii-1].values[RM.Data.Attributes.PRIMARY_TEXT].includes("Tabella " + txt.replace( /(^.+\D)(\d+)(\D.+$)/i,'$2'))));
					if(result.data[ii-1].values[RM.Data.Attributes.PRIMARY_TEXT].includes("Tabella " + txt.replace( /(^.+\D)(\d+)(\D.+$)/i,'$2'))) captionpairs.push(result.data[ii-1].ref, result.data[ii].ref,result.data[i].ref);
					else captionpairs.push(null,result.data[ii].ref,result.data[i].ref);
				}
			}
			var j;
			$("#result").empty();
			println(total+" captions found, joining...");
			for(j = 0; j < captionpairs.length; j++)
			{
				selection = [];
				if((j+1)%3 == 0)
				{
					if(captionpairs[j-2] == null) selection.push(captionpairs[j-1],captionpairs[j]);
					else selection.push(captionpairs[j-2],captionpairs[j-1],captionpairs[j]);
					await join(selection);
					$("#result").empty();
					println("Joined: "+counter+"/"+total);
				}
			}
		});
	});
	
});
