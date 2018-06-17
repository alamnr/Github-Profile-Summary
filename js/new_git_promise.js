var data = createDataObject();
// Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  
  return xhr;
}


function get(url){

	var requestPromise = new Promise((resolve,reject)=>{
		var req = createCORSRequest('GET',url);
		req.onload = () => {
			if(req.status == 200){
			  //resolve(req.response);
			    //console.log(req.getResponseHeader('Link'));
				if(req.getResponseHeader('Link')){
				  resolve(JSON.stringify({linkData:req.getResponseHeader('Link'),data:JSON.parse(req.response)}));
				}
				else{
          if(url.includes('repos') || url.includes('commits')){
            resolve(JSON.stringify({data:JSON.parse(req.response)}));
          }
          
          else{
            resolve(req.response);  
          }
				  
				}
			}
			else{
				reject(Error(req.statusText));
			}
		};
		// Handle network error
		req.onerror = () => {
			reject(Error('Network Error'));
		}
		req.send();
	}); 
	return Promise.all([requestPromise],results=>{
		return results[0];
	});
	
}

function getJSON(url){
	return get(url).then(JSON.parse)
}

function getUserRepos(url, repos){
	//console.log('repo url-',url);
	return getJSON(url).then(response=>{
		//console.log(response);
		if(!repos){
			repos = [];
		}
		repos = repos.concat(response.data);
		console.log(repos.length + " repos so far");
		//console.log("repos- ",response);
		if(response.linkData){
			if (parse_link_header(response.linkData).next){
			   
        //console.log("There is more.");
        
			 let next = parse_link_header(response.linkData).next;
			 //console.log('next - ',next);
        return getUserRepos(next, repos);
      }
		}
    
		 
		//console.log('Repo Array - ',repos);
    data.setRepos(repos);
    //console.log('Repos Array-',data.getRepos());
		return repos;
    
    
	}).catch(err=>console.log(err));
}


getJSON('https://api.github.com/users/alamnr?client_id=4451d14d8fff3a16d020&client_secret=d317892c35d7a7f4e383b92052cda6e8b7a3b3ea')
.then(userData=>{
  console.log(userData);
	console.log('Email-',userData.email);
  let url ='https://api.github.com/users/' + userData.login + '/repos?per_page=100&client_id=4451d14d8fff3a16d020&client_secret=d317892c35d7a7f4e383b92052cda6e8b7a3b3ea';
 
    return  getUserRepos(url);
 
	 //console.log('Repo Array - ',repoArray);
}).then((repos)=>{
 console.log('All fetched repos-', repos);
  
  /* 
   var sequence = Promise.resolve();

   data.getRepos().forEach(repo=>{
      let url = repo.commits_url.replace('{/sha}', '')+'?per_page=100&client_id=4451d14d8fff3a16d020&client_secret=d317892c35d7a7f4e383b92052cda6e8b7a3b3ea';
       
       sequence = sequence.then(()=>{
        return getCommitPerRepos(url,null,repo.name);
       }).then(commits=>{
          console.log('commits count - ',commits);
       });
      
    }) */
  
  data.getRepos().reduce((sequence,repo)=>{
    let url = repo.commits_url.replace('{/sha}', '')+'?per_page=100&client_id=4451d14d8fff3a16d020&client_secret=d317892c35d7a7f4e383b92052cda6e8b7a3b3ea';
    return sequence.then(()=>{
      return getCommitPerRepos(url,null,repo.name);
    }).then(commits=>{
      console.log(repo.name,' - commits count - ',commits);
    });
  },Promise.resolve());
  
  
 
}).catch(err=>console.log(err))

/*
Exception: ReferenceError: getJSON is not defined
@Scratchpad/1:2:1
*/

 function getCommitPerRepos(url, commits, repoName){
	//console.log('commit url-',url);
  return  getJSON(url).then(response=>{
		//console.log(response);
		if(!commits){
			commits = [];
		}
		commits = commits.concat(response.data);
		//console.log(commits.length + " commits so far");
		//console.log("commits- ",response);
		if(response.linkData){
			if (parse_link_header(response.linkData).next){
			   
        //console.log("There is more.");
        
			 let next = parse_link_header(response.linkData).next;
			 //console.log('next - ',next,'Repo Name-',repoName);
        return getCommitPerRepos(next, commits,repoName);
      }
		}
		 
		//console.log('repoName - ',repoName,' commit - ',commits);
    data.getCommitMap().set(repoName,commits);
    //console.log('Commit Map-',data.getCommitMap());
		return commits;
     
	}).catch(err=>console.log(err));
}




function parse_link_header(header) {
    if (header.length === 0) {
        throw new Error("input must not be of zero length");
    }

    // Split parts by comma
    var parts = header.split(',');
    var links = {};
    // Parse each part into a named link
    for(var i=0; i<parts.length; i++) {
        var section = parts[i].split(';');
        if (section.length !== 2) {
            throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    }
    return links;
}

function createDataObject(){
  var quarterCommitCount = new Map();
  var langRepoCount = new Map();
  var langStarCount = new Map();
  var langCommitCount = new Map();
  var repoCommitCount = new Map();
  var repoStarCount = new Map();
  var repoCommitCountDescriptions = new Map();
  var repoStarCountDescriptions = new Map();
  var user;
	var repos;
	var commitMap = new Map();
  var dataObject ={
    getCommitMap:function(){
      return commitMap;
    },
    setCommitMap:function(commitMapN){
      commitMap = commitMapN;
    },
		getQuarterCommitCount:function(){
      return quarterCommitCount;
    },
    setQuarterCommitCount:function(quarterCommitCountMap){
      quarterCommitCount = quarterCommitCountMap;
    },
    getLangRepoCount:function(){
      return langRepoCount;
    },
    setLangRepoCount:function(langRepoCountMap){
      langRepoCount = langRepoCountMap;
    },
    getLangStarCount:function(){
      return langStarCount;
    },
    setLangStarCount: function(langStarCountMap){
      langStarCount = langStarCountMap;
    },
    getLangCommitCount:function(){
      return langCommitCount;
    },
    setLangCommitCount:function(langCommitCountMap){
       langCommitCount = langCommitCountMap;
    },
    getRepoCommitCount:function(){
      return repoCommitCount;
    },
    setRepoCommitCount:function(repoCommitCountMap){
      repoCommitCount = repoCommitCountMap;
    },
    getRepoStarCount:function(){
      return repoStarCount;
    },
    setRepoStarCount: function(repoStarCountMap){
      repoStarCount = repoStarCountMap;
    },
    getRepoCommitCountDescriptions:function(){
      return repoCommitCountDescriptions;
    },
    setRepoCommitCountDescriptions:function(repoCommitCountDescriptionsMap){
      repoCommitCountDescriptions = repoCommitCountDescriptionsMap;
    },
    getRepoStarCountDescriptions:function(){
      return repoStarCountDescriptions;
    },
    setRepoStarCountDescriptions:function(repoStarCountDescriptionsMap){
      repoStarCountDescriptions = repoStarCountDescriptionsMap
    },
    getUser:function(){
      return user;
    },
    setUser:function(userObj){
      user = userObj;
    },
		getRepos:function(){
      return repos;
    },
    setRepos:function(repoArray){
      repos = repoArray;
    }

  };
  return dataObject;
}




/*
Exception: SyntaxError: unexpected token: ')'
@Scratchpad/1:128
*/