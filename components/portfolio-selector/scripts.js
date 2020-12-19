var dataAPI;

fetch('https://api.emberfund.io/portfolios/predefined')
  .then((response) => response.json())
  .then((responseJSON) => {
    dataAPI = responseJSON;
    onLoad();
  });

var allCharts = [];
var selectedChart;
var selectedPerformance = "";
var canvas;
var firstUpdate = true;

$(window).on('resize', function(event) {
  var windowSize = $(window).width();
  if (windowSize > 1200 && windowSize < 1224) {
    onLoad();
  }
});

function onLoad() {
  var buttonInject = '<div id="button-indicator"></div>';
  for (const key of Object.keys(dataAPI.portfolioExamples)) {
    buttonInject = buttonInject + "<h1 id='button-" + key + "' class='button' onclick='portfolioSelect()'>" + dataAPI.portfolioExamples[key].name.replace(' Fund', '') + "</h1>";
    allCharts.push(key);
  }
  $("#button-container").html(buttonInject);

  $(".button-active").removeClass("button-active");
  selectedChart = 0;
  selectedPerformance = $("#button-ytd")[0];
  $("#button-" + selectedChart).addClass("button-active");
  selectedPerformance.classList.add("button-active");
  updateData();
  updatePerformance();
}

function portfolioSelect() {
  if ($(window).width() < 1200) {
    $("#portfolio-header").html(dataAPI.portfolioExamples[selectedChart].name).hide().fadeIn(500);
  } else {
    $("#button-" + selectedChart).toggleClass("button-active");
    $(event.target)[0].classList.toggle("button-active");
  }
  if (selectedChart === $(event.target)[0].id.replace("button-", "")) {
    return;
  }
  selectedChart = $(event.target)[0].id.replace("button-", "");
  updateData();
  updatePerformance();
}

function performanceSelect() {
  selectedPerformance.classList.remove("button-active");
  $(event.target)[0].classList.add("button-active");
  if (selectedPerformance === $(event.target)[0]) {
    return;
  }
  selectedPerformance = $(event.target)[0];
  updatePerformance();
}

function updateData() {
  $("#button-indicator").css("top", 12 + 48 * selectedChart);

  if (!firstUpdate) {
    canvas.destroy();
  }

  var tokens = [];
  var symbols = [];
  var weights = [];
  for (const key of Object.keys(dataAPI.portfolioExamples[selectedChart].allocation)) {
    tokens.push((dataAPI.portfolioExamples[selectedChart].allocation[key].coinNiceName) + " (" + dataAPI.portfolioExamples[selectedChart].allocation[key].coinName.toUpperCase() + ")");
    symbols.push(dataAPI.portfolioExamples[selectedChart].allocation[key].coinName);
    weights.push(Math.round((dataAPI.portfolioExamples[selectedChart].allocation[key].percentage) * 10) / 10).toFixed(1);
  }
  var colors = [];
  for (var i = 0; i < symbols.length; i++) {
    switch (symbols[i]) {
      case "btc":
        colors.push("rgb(242,171,78)");
        break;
      case "bch":
        colors.push("rgb(25,189,155)");
        break;
      case "eth":
        colors.push("rgb(78,103,209)");
        break;
      case "ltc":
        colors.push("rgb(194,197,202)");
        break;
      case "xrp":
        colors.push("rgb(105,224,224)");
        break;
      case "bnb":
        colors.push("rgb(234,221,59)");
        break;
      case "bat":
        colors.push("rgb(224,88,105)");
        break;
      case "dent":
        colors.push("rgb(97,105,117)");
        break;
      case "enj":
        colors.push("rgb(160,95,206)");
        break;
      case "appc":
        colors.push("rgb(232,146,216)");
        break;
      case "qkc":
        colors.push("rgb(51,74,135)");
        break;
      case "tusd":
        colors.push("rgb(129,164,226)");
        break;
      default:
        colors.push("rgb(25,189,155)");
        break;
    }
  }

  canvas = new Chart(document.getElementById("chart-canvas"), {
    "type": "doughnut",
    "data": {
      "datasets": [{
        "data": weights,
        "backgroundColor": colors,
        "borderColor": "white",
        "hoverBorderColor": "white",
        "borderWidth": 4
      }]
    },
    "options": {
      "tooltips": {
        "enabled": false
      },
      "hover": {
        "mode": null
      },
      "aspectRatio": 1,
      "cutoutPercentage": 70
    }
  });

  labelSet(tokens, weights, symbols, colors);

  var coverage;
  var coverageNum = dataAPI.portfolioExamples[selectedChart].marketCoverage;
  if (coverageNum === 0) {
    coverageNum = "NA";
    coverage = "Market Coverage: " + coverageNum;
  } else {
    coverage = "Market Coverage: " + coverageNum + "%";
  }

  var minDeposit = "Minimum Deposit: $" + rounding(dataAPI.portfolioExamples[selectedChart].minDepositDollars, 0);
  var description = dataAPI.portfolioExamples[selectedChart].description;
  $("#portfolio-coverage").html(coverage);
  $("#portfolio-deposit").html(minDeposit);
  $("#portfolio-description").html(description).hide().fadeIn(500);

  if ($(window).width() < 1200) {
    $("#portfolio-header").html(dataAPI.portfolioExamples[selectedChart].name).hide().fadeIn(500);
  } else {
    $("#portfolio-header").html(dataAPI.portfolioExamples[selectedChart].name);
  }

  firstUpdate = false;
}

function updatePerformance() {
  $("#portfolio-growth").hide();
  var performancePoints = dataAPI.portfolioExamples[selectedChart].performance.performancePoints;
  var currentTime = Object.keys(performancePoints)[Object.keys(performancePoints).length-1];
  var currentPerf = performancePoints[currentTime];
  var currentYear = parseInt(currentTime.substring(0,4));

  var ytd;
  var dateObj = new Date(currentTime);
  var tmObj = new Date();
  var omObj = new Date();
  tmObj.setMonth(dateObj.getMonth()-3);
  omObj.setMonth(dateObj.getMonth()-1);
  tmObj = moment(tmObj).format().slice(0, 14).concat("00:00.000+0000");
  omObj = moment(tmObj).format().slice(0, 14).concat("00:00.000+0000");
  var tmPerformance = performancePoints[tmObj];
  var omPerformance = performancePoints[omObj];

  if (currentYear === 2019) {
    ytd = rounding((currentPerf - performancePoints["2019-01-02T00:00:00.000+0000"])/performancePoints["2019-01-02T00:00:00.000+0000"]*100, 2);
  } else {
    ytd = rounding((currentPerf - performancePoints[currentYear + "-01-01T00:00:00.000+0000"])/performancePoints[currentYear + "-01-01T00:00:00.000+0000"]*100, 2);
  }

  threeMonth = rounding((currentPerf - tmPerformance)/tmPerformance*100, 2);
  oneMonth = rounding((currentPerf - omPerformance)/omPerformance*100, 2);

  if (selectedPerformance.id === "button-ytd") {
    $("#portfolio-growth").html(performanceColor(ytd)).fadeIn(500);
  }

  else if (selectedPerformance.id === "button-3m") {
    $("#portfolio-growth").html(performanceColor(threeMonth)).fadeIn(500);
  } else {
    $("#portfolio-growth").html(performanceColor(oneMonth)).fadeIn(500);
  }
}

function performanceColor(numb) {
  var string;

  if (numb >= 0) {
    $("#portfolio-growth").addClass("portfolio-growth--green");
    $("#portfolio-growth").removeClass("portfolio-growth--red");
    string = "+" + numb + "%";
  } else {
    $("#portfolio-growth").addClass("portfolio-growth--red");
    $("#portfolio-growth").removeClass("portfolio-growth--green");
    string = numb + "%";
  }

  return string;
}

function labelSet(tokens, weights, symbols, colors) { //chartjs piece label
  var numbFunds = dataAPI.portfolioExamples[selectedChart].allocation.length;
  var htmlString = "";
  var pos1 = 'style="left:250px;top:0px;"';
  var pos2 = 'style="left:340px;top:150px;"';
  var pos2_1 = 'style="left:290px;top:95px;"';
  var pos2_2 = 'style="left:290px;top:185px;"';
  var pos3 = 'style="left:250px;top:280px;"';
  var pos4 = 'style="right:0px;top:280px;"';
  var pos5 = 'style="right:48px;top:150px;"';
  var pos5_1 = 'style="right:48px;top:185px;"';
  var pos5_2 = 'style="right:48px;top:95px;"';
  var pos6 = 'style="right:0px;top:0px;"';

  switch (numbFunds) {
    case 1:
      htmlString = '<div id="label' + 1 + '" class="chart-label" ' + pos1 + '>' + iconSet(symbols[0], colors[0]) + '<h1>' + tokens[0] + '</h1><p>' + weights[0] + '%</p></div>';
      $("#chart-labels").html(htmlString).hide().fadeIn(500);
      break;
    case 2:
      htmlString = '<div id="label' + 1 + '" class="chart-label" ' + pos2 + '>' + iconSet(symbols[0], colors[0]) + '<h1>' + tokens[0] + '</h1><p>' + weights[0] + '%</p></div>';
      htmlString = htmlString + '<div id="label' + 2 + '" class="chart-label" ' + pos5 + '>' + iconSet(symbols[1], colors[1]) + '<h1>' + tokens[1] + '</h1><p>' + weights[1] + '%</p></div>';
      $("#chart-labels").html(htmlString).hide().fadeIn(500);
      break;
    case 3:
      htmlString = '<div id="label' + 1 + '" class="chart-label" ' + pos1 + '>' + iconSet(symbols[0], colors[0]) + '<h1>' + tokens[0] + '</h1><p>' + weights[0] + '%</p></div>';
      htmlString = htmlString + '<div id="label' + 2 + '" class="chart-label" ' + pos4 + '>' + iconSet(symbols[1], colors[1]) + '<h1>' + tokens[1] + '</h1><p>' + weights[1] + '%</p></div>';
      htmlString = htmlString + '<div id="label' + 3 + '" class="chart-label" ' + pos6 + '>' + iconSet(symbols[2], colors[2]) + '<h1>' + tokens[2] + '</h1><p>' + weights[2] + '%</p></div>';
      $("#chart-labels").html(htmlString).hide().fadeIn(500);
      break;
    case 4:
      htmlString = '<div id="label' + 1 + '" class="chart-label" ' + pos1 + '>' + iconSet(symbols[0], colors[0]) + '<h1>' + tokens[0] + '</h1><p>' + weights[0] + '%</p></div>';
      htmlString = htmlString + '<div id="label' + 2 + '" class="chart-label" ' + pos4 + '>' + iconSet(symbols[1], colors[1]) + '<h1>' + tokens[1] + '</h1><p>' + weights[1] + '%</p></div>';
      htmlString = htmlString + '<div id="label' + 3 + '" class="chart-label" ' + pos5 + '>' + iconSet(symbols[2], colors[2]) + '<h1>' + tokens[2] + '</h1><p>' + weights[2] + '%</p></div>';
      htmlString = htmlString + '<div id="label' + 4 + '" class="chart-label" ' + pos6 + '>' + iconSet(symbols[3], colors[3]) + '<h1>' + tokens[3] + '</h1><p>' + weights[3] + '%</p></div>';
      $("#chart-labels").html(htmlString).hide().fadeIn(500);
      break;
    case 5:
      if (weights[0] > 50) {
        htmlString = '<div id="label' + 1 + '" class="chart-label" ' + pos1 + '>' + iconSet(symbols[0], colors[0]) + '<h1>' + tokens[0] + '</h1><p>' + weights[0] + '%</p></div>';
        htmlString = htmlString + '<div id="label' + 2 + '" class="chart-label" ' + pos4 + '>' + iconSet(symbols[1], colors[1]) + '<h1>' + tokens[1] + '</h1><p>' + weights[1] + '%</p></div>';
        htmlString = htmlString + '<div id="label' + 3 + '" class="chart-label" ' + pos5_1 + '>' + iconSet(symbols[2], colors[2]) + '<h1>' + tokens[2] + '</h1><p>' + weights[2] + '%</p></div>';
        htmlString = htmlString + '<div id="label' + 4 + '" class="chart-label" ' + pos5_2 + '>' + iconSet(symbols[3], colors[3]) + '<h1>' + tokens[3] + '</h1><p>' + weights[3] + '%</p></div>';
        htmlString = htmlString + '<div id="label' + 5 + '" class="chart-label" ' + pos6 + '>' + iconSet(symbols[4], colors[4]) + '<h1>' + tokens[4] + '</h1><p>' + weights[4] + '%</p></div>';
      } else {
        htmlString = '<div id="label' + 1 + '" class="chart-label" ' + pos1 + '>' + iconSet(symbols[0], colors[0]) + '<h1>' + tokens[0] + '</h1><p>' + weights[0] + '%</p></div>';
        htmlString = htmlString + '<div id="label' + 2 + '" class="chart-label" ' + pos3 + '>' + iconSet(symbols[1], colors[1]) + '<h1>' + tokens[1] + '</h1><p>' + weights[1] + '%</p></div>';
        htmlString = htmlString + '<div id="label' + 3 + '" class="chart-label" ' + pos4 + '>' + iconSet(symbols[2], colors[2]) + '<h1>' + tokens[2] + '</h1><p>' + weights[2] + '%</p></div>';
        htmlString = htmlString + '<div id="label' + 4 + '" class="chart-label" ' + pos5 + '>' + iconSet(symbols[3], colors[3]) + '<h1>' + tokens[3] + '</h1><p>' + weights[3] + '%</p></div>';
        htmlString = htmlString + '<div id="label' + 5 + '" class="chart-label" ' + pos6 + '>' + iconSet(symbols[4], colors[4]) + '<h1>' + tokens[4] + '</h1><p>' + weights[4] + '%</p></div>';
      }
      $("#chart-labels").html(htmlString).hide().fadeIn(500);
      break;
  }
}

function iconSet(token, color) {
  return '<i class="crypto-icon ' + token + ' chart-label--icon" style="color:' + color + '"></i>'
}

function leftArrow() {
  i = allCharts.indexOf(selectedChart);
  size = allCharts.length;

  if (i === 0) {
    i = size - 1;
  } else {
    i--;
  }

  selectedChart = allCharts[i];
  updateData();
  updatePerformance();
}

function rightArrow() {
  i = allCharts.indexOf(selectedChart);
  size = allCharts.length;

  if (i === (size - 1)) {
    i = 0;
  } else {
    i++;
  }

  selectedChart = allCharts[i];
  updateData();
  updatePerformance();
}

function rounding(num, scale) {
  return num.toFixed(scale);
}
