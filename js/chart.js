function createLineChart() {
   
    var keys=[];
    var values=[];
    for (var [key, value] of quarterCommitCount.entries()) {
        
        keys.push(key);
        values.push(value);

      }
   
      //console.log('key-'+keys+' values-'+values);
    var ctx = document.getElementById('quarterCommitCount').getContext('2d');
    var chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels: keys,
            datasets: [{
                label: "Commits",
                backgroundColor: "rgba(67, 142, 233, 0.2)",
                borderColor: "rgba(67, 142, 233, 1)",
                lineTension: 0,
                data: values
            }]
        },

        // Configuration options go here
        options: {
            maintainAspectRatio: false,
            animation: false,
            scales: {
                xAxes: [{
                    display: false
                }],
                yAxes: [{
                    position: "right",
                    beginAtZero: true
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                intersect: false
            },
            title: {
                display: true,
                text: 'Commits per Quarter',
                position:'bottom'
            }
        }
    });
}



function createDoughnutChart(id, data, options) {
    var ctx = document.getElementById(id).getContext('2d');
    // For a pie chart
    var myPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            animation: false,
            rotation: (-0.40 * Math.PI),
            legend: { // todo: fix duplication ?
                position: window.innerWidth < 600 ? "bottom" : "left",
                labels: {
                    fontSize: window.innerWidth < 600 ? 10 : 12,
                    padding: window.innerWidth < 600 ? 8 : 10,
                    boxWidth: window.innerWidth < 600 ? 10 : 12
                }
            },
            onResize: function (instance) { // todo: fix duplication ?
                instance.chart.options.legend.position = window.innerWidth < 600 ? "bottom" : "left";
                instance.chart.options.legend.labels.fontSize = window.innerWidth < 600 ? 10 : 12;
                instance.chart.options.legend.labels.padding = window.innerWidth < 600 ? 8 : 10;
                instance.chart.options.legend.labels.boxWidth = window.innerWidth < 600 ? 10 : 12;
            }
        }
    });

}
