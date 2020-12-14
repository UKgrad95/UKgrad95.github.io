(function () {

  const map = L.map('map', {
    zoomSnap: .1,
    center: [-.23, 37.8],
    zoom: 7,
    minZoom: 6,
    maxZoom: 9,
    maxBounds: L.latLngBounds([-6.22, 27.72], [5.76, 47.83])
  });

  // mapbox API access Token
  // var accessToken = '<your access token here>'
  // var accessToken = 'pk.eyJ1IjoidWtncmFkOTUiLCJhIjoiY2tiZTR2cWhmMGlhejJzb2l5eG9pcW1ldCJ9.GpQXTEFxWn2N6ur5BPxRbg';

  // mapbox API parameters
  const accessToken =
    `pk.eyJ1IjoidWtncmFkOTUiLCJhIjoiY2tiZTR2cWhmMGlhejJzb2l5eG9pcW1ldCJ9.GpQXTEFxWn2N6ur5BPxRbg`
  const yourName = 'ukgrad95'
  const yourMap = 'ckh78a58h0emu19ltuxd3u46b'


  /*L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + accessToken, {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.light',
    accessToken: accessToken
  }).addTo(map);*/

  L.tileLayer(`https://api.mapbox.com/styles/v1/${yourName}/${yourMap}/tiles/256/{z}/{x}/{y}?access_token=${accessToken}`, {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18
  }).addTo(map);

  // use omnivore to load the CSV data
  omnivore.csv('data/kenya_education_2014.csv')
    .on('ready', function (e) {
      //console.log(e.target)
      drawMap(e.target.toGeoJSON());
      drawLegend(e.target.toGeoJSON());
    })
    .on('error', function (e) {
      console.log(e.error[0].message);
      //}).addTo(map); // add the point data to the map
    });


  function drawMap(data) {
    // access to data here
    console.log(data);

    const options = {
      pointToLayer: function (feature, ll) {
        return L.circleMarker(ll, {
          opacity: 1,
          weight: 2,
          fillOpacity: 0,
        })
      }
    }

    // create 2 separate layers from GeoJSON data
    const girlsLayer = L.geoJson(data, options).addTo(map),
      boysLayer = L.geoJson(data, options).addTo(map);

    girlsLayer.setStyle({
      color: '#D96D02',
    });
    boysLayer.setStyle({
      color: '#6E77B0',
    });

    // fit the bounds of the map to one of the layers
    map.fitBounds(girlsLayer.getBounds());

    // adjust zoom level of map
    map.setZoom(map.getZoom() - .4);

    resizeCircles(girlsLayer, boysLayer, 1);
    drawLegend(data);
    sequenceUI(girlsLayer, boysLayer);
    
  } // end drawMap(data)

  function calcRadius(val) {

    const radius = Math.sqrt(val / Math.PI);
    return radius * .5; // adjust .5 as a scale factor

  }

  function resizeCircles(girlsLayer, boysLayer, currentGrade) {

    girlsLayer.eachLayer(function (layer) {
      const radius = calcRadius(Number(layer.feature.properties['G' + currentGrade]));
      layer.setRadius(radius);
    });
    boysLayer.eachLayer(function (layer) {
      const radius = calcRadius(Number(layer.feature.properties['B' + currentGrade]));
      layer.setRadius(radius);
    });

    retrieveInfo(boysLayer, currentGrade);
    //updateGrade(currentGrade);
  }

  function retrieveInfo(boysLayer, currentGrade) {
    // select the element and reference with variable
    // and hide it from view initially
    const info = $('#info').hide();

    // since boysLayer is on top, use to detect mouseover events
    boysLayer.on('mouseover', function (e) {

      // remove the none class to display and show
      info.show();

      // access properties of target layer
      const props = e.layer.feature.properties;

      // populate HTML elements with relevant info
      $('#info span').html(props.COUNTY);
      $(".girls span:first-child").html(`(grade ${currentGrade})`);
      $(".boys span:first-child").html(`(grade ${currentGrade})`);
      $(".girls span:last-child").html(Number(props[`G${currentGrade}`]).toLocaleString());
      $(".boys span:last-child").html(Number(props[`B${currentGrade}`]).toLocaleString());

      // raise opacity level as visual affordance
      e.layer.setStyle({
        fillOpacity: .6
      });

      // empty arrays for boys and girls values
      const girlsValues = [],
        boysValues = [];

      // loop through the grade levels and push values into those arrays
      for (let i = 1; i <= 8; i++) {
        girlsValues.push(props['G' + i]);
        boysValues.push(props['B' + i]);
      }

      $('.girlspark').sparkline(girlsValues, {
        width: '200px',
        height: '30px',
        lineColor: '#D96D02',
        fillColor: '#d98939 ',
        spotRadius: 0,
        lineWidth: 2
      });

      $('.boyspark').sparkline(boysValues, {
        width: '200px',
        height: '30px',
        lineColor: '#6E77B0',
        fillColor: '#878db0',
        spotRadius: 0,
        lineWidth: 2
      });

    });

    // hide the info panel when mousing off layergroup and remove affordance opacity
    boysLayer.on('mouseout', function (e) {

      // hide the info panel
      info.hide();

      // reset the layer style
      e.layer.setStyle({
        fillOpacity: 0
      });
    });

    // when the mouse moves on the document
    $(document).mousemove(function (e) {
      // first offset from the mouse position of the info window
      info.css({
        "left": e.pageX + 6,
        "top": e.pageY - info.height() - 25
      });

      // if it crashes into the top, flip it lower right
      if (info.offset().top < 4) {
        info.css({
          "top": e.pageY + 15
        });
      }
      // if it crashes into the right, flip it to the left
      if (info.offset().left + info.width() >= $(document).width() - 40) {
        info.css({
          "left": e.pageX - info.width() - 80
        });
      }
    });
  }

  function sequenceUI(girlsLayer, boysLayer) {

    // sequenceUI function body
    
    // create Leaflet control for the slider
    const sliderControl = L.control({
      position: 'bottomleft'
    });

    sliderControl.onAdd = function (map) {

      const controls = L.DomUtil.get("slider");

      L.DomEvent.disableScrollPropagation(controls);
      L.DomEvent.disableClickPropagation(controls);

      return controls;

    }

    // add it to the map
    sliderControl.addTo(map);

    // create Leaflet control for the grade legend
    const gradeControl = L.control({
      position: 'bottomleft'
    });

    gradeControl.onAdd = function (map) {

      const controls = L.DomUtil.get("grade");

      L.DomEvent.disableScrollPropagation(controls);
      L.DomEvent.disableClickPropagation(controls);

      return controls;
    }

    // add grade legend to map
    gradeControl.addTo(map);

    // select the slider's input and listen for change
    $('#slider input[type=range]')
      .on('input', function () {

        // current value of slider is current grade level
        var currentGrade = this.value;
        $('#grade span').html(currentGrade);
        $('#slider p span').html(currentGrade);
        
        // resize the circles with updated grade level
        resizeCircles(girlsLayer, boysLayer, currentGrade);
      
      });
  } // end sequenceUI()

  function drawLegend(data) {
    // create Leaflet control for the legend
    const legendControl = L.control({
      position: 'bottomright'
    });

    // when the control is added to the map
    legendControl.onAdd = function (map) {

      // select the legend using id attribute of legend
      const legend = L.DomUtil.get("legend");

      // disable scroll and click functionality 
      L.DomEvent.disableScrollPropagation(legend);
      L.DomEvent.disableClickPropagation(legend);

      // return the selection
      return legend;

    }

    legendControl.addTo(map);

    // empty array to hold values
    const dataValues = [];

    // loop through all features (i.e., the schools)
    data.features.forEach(function (school) {
      // for each grade in a school
      for (let grade in school.properties) {
        // shorthand to each value
        const value = school.properties[grade];
        // if the value can be converted to a number 
        // the + operator in front of a number returns a number
        if (+value) {
          //return the value to the array
          dataValues.push(+value);
        }

      }
    });
    // verify your results!
    console.log(dataValues);

    // sort our array
    const sortedValues = dataValues.sort(function (a, b) {
      return b - a;
    });

    // round the highest number and use as our large circle diameter
    const maxValue = Math.round(sortedValues[0] / 1000) * 1000;

    // calc the diameters
    const largeDiameter = calcRadius(maxValue) * 2,
      smallDiameter = largeDiameter / 2;

    // select our circles container and set the height
    $(".legend-circles").css('height', largeDiameter.toFixed());

    // set width and height for large circle
    $('.legend-large').css({
      'width': largeDiameter.toFixed(),
      'height': largeDiameter.toFixed()
    });
    // set width and height for small circle and position
    $('.legend-small').css({
      'width': smallDiameter.toFixed(),
      'height': smallDiameter.toFixed(),
      'top': largeDiameter - smallDiameter,
      'left': smallDiameter / 2
    })

    // label the max and median value
    $(".legend-large-label").html(maxValue.toLocaleString());
    $(".legend-small-label").html((maxValue / 2).toLocaleString());

    // adjust the position of the large based on size of circle
    $(".legend-large-label").css({
      'top': -11,
      'left': largeDiameter + 30,
    });

    // adjust the position of the large based on size of circle
    $(".legend-small-label").css({
      'top': smallDiameter - 11,
      'left': largeDiameter + 30
    });

    // insert a couple hr elements and use to connect value label to top of each circle
    $("<hr class='large'>").insertBefore(".legend-large-label")
    $("<hr class='small'>").insertBefore(".legend-small-label").css('top', largeDiameter - smallDiameter - 8);

  }

  //function updateGrade(currentGrade) {

    //select the slider's input and listen for change
    //$('#grade span').html(currentGrade);
    //console.log("")
  //} // end updateGrade()

  
})();