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

var quarterCommitCount = new Map();
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
      // var year = Math.floor((today - then) / 31536000000);
      console.log(lastQuarter);
      for (var i = then.getFullYear(); i <= today.getFullYear(); i++) {
        for (var j = 1; j <= 4; j++) {
          var quarter = i + '-Q' + j;
          quarterCommitCount.set(quarter, 0);
          if (quarter == lastQuarter) break;
        }

      }
      
      calculateQuarterCommitCount(user.login);
      console.log(quarterCommitCount);
      
      /*
      var data = {
        labels: ["Red", "Blue", "Yellow"],
        datasets: [{
          label: "My First Dataset",
          data: [300, 50, 100],
          backgroundColor: ["rgb(255, 99, 132)", "rgb(54, 162, 235)", "rgb(255, 205, 86)"]
        }]
      };
      var options = {};
      createDoughnutChart('langRepoCount', data, options);
      createDoughnutChart('langStarCount', data, options);
      createDoughnutChart('langCommitCount', data, options);

      createDoughnutChart('repoCommitCount', data, options);
      createDoughnutChart('repoStarCount', data, options); */

      indicatorDiv.style.width = '100%';
      indicatorDiv.innerHTML = '100%';
      setTimeout(() => progressDiv.style.visibility = 'hidden', 1000);
      //progressDiv.style.visibility = 'hidden';
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
      console.log('All repos-' + repos.length);

      const unforkRepo = repos.filter(repo => {
        return repo.fork === false
      })
      console.log('Own Repos -' + unforkRepo.length);
      user.ownRepos= unforkRepo.length;
      user.forkedRepos= repos.length - unforkRepo.length;
      unforkRepo.forEach((myRepo,index, repoArray) => {
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
      })
     // console.log('i-'+i+' length-'+repoArray.length);
      if(i===repoArray.length){
        buildUserDetails(user);
        createLineChart();
      }
      
    }
  }

  xhr.send();

}












/*
  new Chart(document.getElementById("chartjs-4"),{"type":"doughnut",
  "data":{"labels":["Red","Blue","Yellow"],
  "datasets":[{"label":"My First Dataset",
  "data":[300,50,100],
  "backgroundColor":["rgb(255, 99, 132)","rgb(54, 162, 235)","rgb(255, 205, 86)"]}]
}});*/