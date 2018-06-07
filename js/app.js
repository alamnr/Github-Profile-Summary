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

/* Global  Scope */
var quarterCommitCount = new Map();
var langRepoCount = new Map();
var langStarCount = new Map();
var langCommitCount = new Map();
var repoCommitCount = new Map();
var repoStarCount = new Map();
var repoCommitCountDescriptions = new Map();
var repoStarCountDescriptions = new Map();
var user;



function getUserInfo(userName) {

  var progressDiv = document.querySelector('.progress');
  var indicatorDiv = document.querySelector('#indicator');

  indicatorDiv.className = 'progress-bar progress-bar-striped bg-success';

  var url = 'https://api.github.com/users/' + userName;
  var xhr = createCORSRequest('GET', url);
  if (!xhr) {
    console.log('CORS not supported');
    return;
  }

  progressDiv.style.visibility = 'visible';
  indicatorDiv.style.width = '0%';
  indicatorDiv.innerHTML = '0%';
  xhr.onreadystatechange = function () {

    if (this.readyState == 1) {
      indicatorDiv.style.width = '25%';
      indicatorDiv.innerHTML = '25%';
    }
    if (this.readyState == 2) {
      indicatorDiv.style.width = '50%';
      indicatorDiv.innerHTML = '50%';
    }
    if (this.readyState == 3) {
      indicatorDiv.style.width = '75%';
      indicatorDiv.innerHTML = '75%';
    }
    if (this.readyState == 4 && this.status == 403) {
      var obj = JSON.parse(this.responseText);
      console.log(obj);

      indicatorDiv.className = 'progress-bar progress-bar-striped bg-danger';
      setTimeout(() => progressDiv.style.visibility = 'hidden', 1000);
      document.getElementById('errMsg').innerHTML = obj.message;
      document.getElementById('errMsg').style.color = 'red';
    }
    if (this.readyState == 4 && this.status == 404) {
      var response = JSON.parse(this.responseText);
      console.log(response.message);
      indicatorDiv.className = 'progress-bar progress-bar-striped bg-danger';
      setTimeout(() => progressDiv.style.visibility = 'hidden', 1000);
      document.getElementById('errMsg').innerHTML = response.message;
      document.getElementById('errMsg').style.color = 'red';
    }
    if (this.readyState == 4 && this.status == 200) {
       user = JSON.parse(this.responseText);

      document.getElementById('profileImage').src = user.avatar_url;
      document.getElementById('profileImage').alt = user.name;
      document.getElementById('bio').innerHTML = user.bio;
     
      var then = new Date(user.created_at);

      var today = new Date();
      var lastQuarter = today.getFullYear() + '-Q' + (Math.ceil((today.getMonth() + 1) / 3));
     
      //console.log(lastQuarter);
      for (var i = then.getFullYear(); i <= today.getFullYear(); i++) {
        for (var j = 1; j <= 4; j++) {
          var quarter = i + '-Q' + j;
          quarterCommitCount.set(quarter, 0);
          if (quarter == lastQuarter) break;
        }

      }
      
      calculateQuarterCommitCount(user.login);
      //console.log(quarterCommitCount);
     
    }

  }

  xhr.send();
}

function buildUserDetails(user) {
  var then = new Date(user.created_at);

  var today = new Date();
  var year = Math.floor((today - then) / 31536000000);
  var output = `<ul class="list-group list-group-flush">
                    <li class="list-group-item"><i class="fa fa-fw fa-user"></i> ${user.login} <p><small>( ${user.name} )</small></p>  </li>
                    <li class="list-group-item"><i class="fa fa-fw fa-database"></i> ${user.public_repos} public repos <p><small>(Own Repos- ${user.ownRepos?user.ownRepos:'0'}, Forked- ${user.forkedRepos})</small></p> </li>
                    <li class="list-group-item"><i class="fa fa-fw fa-clock-o"></i>Joined GitHub ${year} Year Ago  </li>
                    <li class="list-group-item"><i class="fa fa-fw fa-envelope"></i> ${user.email ? user.email : ''}  </li>
                    <li class="list-group-item"><i class="fa fa-fw fa-external-link"></i> <a href="${user.html_url}" target="_blank">View Profile On GitHub</a>   </li>
                    </ul>`;
  document.getElementById('userDetail').innerHTML = output;
}




function calculateQuarterCommitCount(userName) {
  var url = 'https://api.github.com/users/' + userName + '/repos?per_page=1000';
  var xhr = createCORSRequest('GET', url);

  if (!xhr) {
    console.log('CORS not supported');
    return;
  }

  xhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var repos = JSON.parse(this.responseText);
      //console.log('All repos-' + repos.length);

      const unforkRepo = repos.filter(repo => {
        return repo.fork === false && repo.size !== 0
      })
     // console.log('Own Repos -' + unforkRepo.length);
      user.ownRepos= unforkRepo.length;
      user.forkedRepos= repos.length - unforkRepo.length;
      unforkRepo.forEach((myRepo,index, repoArray) => {
        
        langRepoCount.set(myRepo.language,(langRepoCount.get(myRepo.language) ?  langRepoCount.get(myRepo.language) :0) +1);
        langStarCount.set(myRepo.language,(langStarCount.get(myRepo.language) ?  langStarCount.get(myRepo.language) :0) +myRepo.watchers_count);

        repoStarCount.set(myRepo.name,(repoStarCount.get(myRepo.name) ?  repoStarCount.get(myRepo.name) :0) +myRepo.watchers_count);
        repoStarCountDescriptions.set(myRepo.name,myRepo.description ? myRepo.description:'Description Not Found' );
        //console.log(myRepo.commits_url.replace('{/sha}',''))
        makeAjaxCORSRequestForQuarterCommitLineChart(myRepo.commits_url.replace('{/sha}', ''),index, repoArray);

      })
      
    }
  }

  xhr.send();
}

var i=0;
function makeAjaxCORSRequestForQuarterCommitLineChart(url,index, repoArray) {
  var xhr = createCORSRequest('GET', url);
  
  if (!xhr) {
    console.log('CORS not supported');
    return;
  }
  xhr.onreadystatechange = function () {
   
    if (this.readyState == 4 && this.status == 200) {
      var commits = JSON.parse(this.responseText);
      i++;
      
      // console.log(commits);

      commits.forEach(commit => {

        var commitDate = new Date(commit.commit.committer.date);
        var commitQuarter = commitDate.getFullYear() + '-Q' + (Math.ceil((commitDate.getMonth() + 1) / 3));
        quarterCommitCount.set(commitQuarter, quarterCommitCount.get(commitQuarter) + 1);

        langCommitCount.set(repoArray[index].language,(langCommitCount.get(repoArray[index].language) ?  langCommitCount.get(repoArray[index].language) :0) +1);

        repoCommitCount.set(repoArray[index].name,(repoCommitCount.get(repoArray[index].name) ?  repoCommitCount.get(repoArray[index].name) :0) +1);
        repoCommitCountDescriptions.set(repoArray[index].name,repoArray[index].description? repoArray[index].description:'Description Not Found' );
      
      })
     // console.log('i-'+i+' length-'+repoArray.length);
      if(i===repoArray.length){
        buildUserDetails(user);
        createLineChart();
        createDoughnutChart('langRepoCount',langRepoCount);
       
        for (let value of langStarCount.values()) {
          if(value){
            let output = `<div id="langStarCountDiv" class="col-xs-12 col-sm-12 col-md-12 col-lg-4">
            <h4 class="text-center">Star per Language </h4>
            <canvas id="langStarCount"></canvas>
        </div>`;
            document.getElementById('langRepoCountDiv').className = 'col-xs-12 col-sm-12 col-md-12 col-lg-4';
            document.getElementById('langCommitCountDiv').className = 'col-xs-12 col-sm-12 col-md-12 col-lg-4';
            
            let targetDiv=document.getElementById('langRepoCountDiv')
            var divToAppend = document.createRange().createContextualFragment(output);
            targetDiv.parentNode.insertBefore(divToAppend, targetDiv.nextSibling)
            createDoughnutChart('langStarCount',langStarCount);
            
            break;
          }
        }
        for (let value of langCommitCount.values()) {
          if(value){
            createDoughnutChart('langCommitCount',langCommitCount);
            break;
          }
        }

        for (let value of repoCommitCount.values()) {
          if(value){
            var top10SortedRepoCommitCount = new Map([...repoCommitCount.entries()].sort((a, b) => b[1] - a[1]));
            var top10SortedRepoCommitCountDescription = new Map();
            var j= 0;
            top10SortedRepoCommitCount.forEach(function(value,key,map){
              j++;
              if(j>10){
                map.delete(key);
              }
              if(value===0){
                map.delete(key);
              }
            })
           // console.log(top10SortedRepoCommitCount);
            top10SortedRepoCommitCount.forEach(function(value,key,map){
              top10SortedRepoCommitCountDescription.set(key,repoCommitCountDescriptions.get(key));
           })
           repoCommitCountDescriptions = top10SortedRepoCommitCountDescription;
           //console.log(repoCommitCountDescriptions);
            createDoughnutChart('repoCommitCount',top10SortedRepoCommitCount);
            break;
          }
        }

        
        for (let value of repoStarCount.values()) {
          if(value){
            let output =`<div id="repoStarCountDiv"  class="col-xs-12 col-sm-12 col-md-6 col-lg-6">
            <h4 class="text-center">Stars per Repo (top 10)</h4>
            <canvas id="repoStarCount"></canvas>
        </div>`;
        document.getElementById('repoCommitCountDiv').className = 'col-xs-12 col-sm-12 col-md-6 col-lg-6';
        
        
        
        let targetDiv=document.getElementById('repoCommitCountDiv')
        var divToAppend = document.createRange().createContextualFragment(output);
        targetDiv.parentNode.insertBefore(divToAppend, targetDiv.nextSibling)

             var top10SortedRepoStarCount = new Map([...repoStarCount.entries()].sort((a, b) => b[1] - a[1]));
              var top10SortedRepoStarCountDescription = new Map();
            var j= 0;
            top10SortedRepoStarCount.forEach(function(value,key,map){
              j++;
              if(j>10){
                map.delete(key);
              }
              if(value===0){
                map.delete(key);
              }
            })
           // console.log(top10SortedRepoStarCount);
             top10SortedRepoStarCount.forEach(function(value,key,map){
                top10SortedRepoStarCountDescription.set(key,repoStarCountDescriptions.get(key));
             })
             repoStarCountDescriptions = top10SortedRepoStarCountDescription;
            // console.log(repoStarCountDescriptions);
            createDoughnutChart('repoStarCount',top10SortedRepoStarCount);
            break;
          }
        } 

        setShareButtonHref();
         
        document.querySelector('#indicator').style.width = '100%';
        document.querySelector('#indicator').innerHTML = '100%';
        setTimeout(() => document.querySelector('.progress').style.visibility = 'hidden', 1000);
     
      }
      
    }
  }

  xhr.send();

}


function setShareButtonHref(){
  let profileUrl  = "https://alamnr.github.io/profile.html?user=" + user.login;
  let shareText = user.login + "'s GitHub profile - Visualized:";
  let twitterUrl = "https://twitter.com/intent/tweet?url=" + profileUrl + "&text=" + shareText + "&via=javascript&related=scope_closer";
  let facebookUrl = "https://facebook.com/sharer.php?u=" + profileUrl + "&quote=" + shareText;
  document.getElementById('twitter').href=twitterUrl;
  document.getElementById('facebook').href=facebookUrl;
  //console.log(twitterUrl);
  //console.log(facebookUrl);
}



