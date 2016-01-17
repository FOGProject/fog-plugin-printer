$.fogPrinter = {};
var toInstallTable;
var installedTable;
var defaultPrinter = '';
var managementAction = 'none';
$.fogPrinter.afterGetData = function(dataIn) {
  $('#printerAddonHeader').html('Manage Printers for Host ' + dataIn.name);
  $.fogPrinter.GetPrinters(function(allPrinters) {
    var toSend = {};
    toSend.action = 'printer';
    toSend.task = 'parse';
    toSend.uid = dataIn.uid;
    toSend.type = 'host'
    $.fogDashBoard.GetSocketData('/printer',
    toSend,function(fromServer) {
      printers = fromServer;
      $.fogPrinter.ProcessData(allPrinters,printers);
    });
  })
}

$.fogPrinter.ProcessData = function(allPrinters, forHost) {
  console.log('got from server:');
  console.log(allPrinters);
  console.log(forHost);
  toInstall = [];
  isInstalled = [];
  if (forHost.printers != null) {
    allPrinters.forEach(function(thisPrinter) {
      didFind = false
      for (entry in forHost.printers.printers) {
        if (forHost.printers.printers[entry] == thisPrinter.uid) {
          newVar = thisPrinter;
          if (forHost.printers.default == forHost.printers.printers[entry]) {
            newVar.isDefault = true;
            defaultPrinter = forHost.printers.default
          } else {
            newVar.isDefault = false;
          }
          didFind = true;
          isInstalled.push(newVar);
          break;
        }
      }
      if (didFind == false) {
        toInstall.push(thisPrinter);
      }
    })
  } else {
    toInstall = allPrinters;
  }
  // Build tables now
  buildString = '<table id="isInstalled" class="table table-bordered table-striped">\
  <thead>\
  <th>\
  <input type="checkbox" rel="isInstalled" class="tableCheckAll masterCheck" /></th>\
  <th>Default</th>\
  <th>Name</th>\
  <th>Type</th>\
  </thead><tbody>';
  isInstalled.forEach(function(data) {
    classes = 'class="fogTableRow"';
    if (forHost.printers.inherited.indexOf(data.uid) > -1) {
      classes = 'class="fogTableRow inheritedPrinter"';
    }
    buildString += '<tr rel="' + data.uid + '" ' + classes + '><td><input type="checkbox" class="tableCheck"></input></td>';
    buildString +=  '<td><input class="ckDefault" rel="' + data.uid + '" type="checkbox"></input></td>';
    buildString += '<td class="dataName">' + data.name + '</td>';
    myType = '';
    if (data.type == 'iprint') {
      myType = 'iPrint Printer';
    } else if (data.type == 'ip') {
      myType = 'IP Printer';
    } else if (data.type == 'network') {
      myType = 'Network Printer';
    } else if (data.type == 'cups') {
      myType = 'CUPS Printer';
    }
    buildString += '<td class="dataType">' + myType + '</td></tr>';
  })
  buildString += '</tbody></table>';
  $('#tblIsInstalled').html(buildString);
  buildString = '<table id="toInstall" class="table table-bordered table-striped"><thead>\
  <th>\
  <input type="checkbox" rel="toInstall" class="tableCheckAll masterCheck"></input>\
  </th>\
  <th>Name</th><th>Type</th></thead><tbody>';
  toInstall.forEach(function(data) {
    buildString += '<tr rel="' + data.uid + '" class="fogTableRow"><td><input type="checkbox" rel="toInstall" class="tableCheck"></input></td>';
    buildString += '<td class="dataName">' + data.name + '</td>';
    myType = '';
    if (data.type == 'iprint') {
      myType = 'iPrint Printer';
    } else if (data.type == 'ip') {
      myType = 'IP Printer';
    } else if (data.type == 'network') {
      myType = 'Network Printer';
    } else if (data.type == 'cups') {
      myType = 'CUPS Printer';
    }
    buildString += '<td class="dataType">' + myType + '</td></tr>';
  })
  buildString += '</tbody></table>';
  $('#tblToAdd').html(buildString);

  installedTable = $('#isInstalled').DataTable({
    paging: true,
    lengthChange: false,
    searching: false,
    ordering: true,
    info: true,
    autoWidth: false,
  });
  toInstallTable = $('#toInstall').DataTable({
    paging: true,
    lengthChange: false,
    searching: false,
    ordering: true,
    info: true,
    autoWidth: false,
  });
  $('.ckDefault').iCheck({
    checkboxClass: 'icheckbox_square-blue',
    radioClass: 'iradio_square-blue',
    increaseArea: '20%',
  });
  $('.ckDefault').each(function() {
    if ($(this).attr('rel') == defaultPrinter) {
      $(this).iCheck('check');
    }
  })
  if (forHost.printers.level != null) {
    $('.printManage').each(function() {
      if ($(this).attr('rel') == forHost.printers.level) {
        $(this).trigger('click');
      }
    })
  }
}

$.fogPrinter.addPrinter = function() {
  $('#toInstall').find('.selectedRow').each(function() {
    thisID = $(this).attr('rel');
    thisType = $(this).find('.dataType').html();
    thisName = $(this).find('.dataName').html();
    newHtml = '<tr rel ="' + thisID + '" class="fogTableRow">';
    newHtml += '<td><input type="checkbox" class="tableCheck"></input></td>';
    newHtml += '<td><input class="ckDefault" type="checkbox" rel="' + thisID + '"></input></td>';
    newHtml += '<td class="dataName">' + thisName + '</td>';
    newHtml += '<td class="dataType">' + thisType + '</td>';
    newHtml += '</tr>'
    installedTable.row.add($(newHtml)).draw();
    toInstallTable.rows('.selectedRow').remove().draw();
    $('.ckDefault').iCheck({
      checkboxClass: 'icheckbox_square-blue',
      radioClass: 'iradio_square-blue',
      increaseArea: '20%',
    });
  })
}

$.fogPrinter.setPrinters = function(dataIn) {
  dataIn.printers = {};
  dataIn.printers.printers = [];
  dataIn.printers.default = defaultPrinter;
  dataIn.printers.level = managementAction;
  $('#isInstalled').find('tr').each(function() {
    thisRel = $(this).attr('rel');
    if (thisRel != null) {
      if ($(this).hasClass('inheritedPrinter')) {
        // Skip printer it got it from a group
      }else {
        dataIn.printers.printers.push(thisRel);
      }
    }
  });
  console.log(dataIn);
}

$.fogPrinter.removePrinter = function() {
  $('#isInstalled').find('.selectedRow').each(function() {
    thisID = $(this).attr('rel');
    thisType = $(this).find('.dataType').html();
    thisName = $(this).find('.dataName').html();
    newHtml = '<tr rel ="' + thisID + '" class="fogTableRow">';
    newHtml += '<td><input type="checkbox" class="tableCheck"></input></td>';
    newHtml += '<td class="dataName">' + thisName + '</td>';
    newHtml += '<td class="dataType">' + thisType + '</td>';
    newHtml += '</tr>'
    toInstallTable.row.add($(newHtml)).draw();
    installedTable.rows('.selectedRow').remove().draw();
    $('.ckDefault').iCheck({
      checkboxClass: 'icheckbox_square-blue',
      radioClass: 'iradio_square-blue',
      increaseArea: '20%',
    });
  })
}

$.fogPrinter.GetPrinters = function(myCB) {
  var toSend = {};
  toSend.action = 'printer';
  toSend.task = 'list';
  $.fogDashBoard.GetSocketData('/printer',
  toSend,function(fromServer) {
    printers = fromServer.list;
    myCB(printers);
  });
}
tableOptions = {
  paging: true,
  lengthChange: false,
  searching: false,
  ordering: true,
  info: true,
  autoWidth: false,
}
$.fogPrinter.BuildControls = function() {
  $('#toggleToAdd').iCheck({
    checkboxClass: 'icheckbox_square-blue',
    radioClass: 'iradio_square-blue',
    increaseArea: '20%',
  });
  $('.printManage').iCheck({
    checkboxClass: 'icheckbox_square-blue',
    radioClass: 'iradio_square-blue' // optional
  });
  postGetData.push($.fogPrinter.afterGetData);
  preUpdate.push($.fogPrinter.setPrinters);
  $(document.body).on('change','.masterCheck',function() {
    thisTable = $(this).attr('rel');
    isCheck = $(this).prop('checked');
    $('#' + thisTable).find('.tableCheck').each(function() {
      $(this).prop('checked',isCheck);
    })
  });
  $(document.body).on('click','tr',function() {
    $(this).toggleClass('selectedRow');
    $(this).find('.tableCheck').prop('checked', $(this).hasClass('selectedRow'));
  });
  $(document.body).on('ifChecked','.ckDefault', function(event) {
    thisCheck = $(this).attr('rel');
    defaultPrinter = thisCheck;
    $('.ckDefault').each(function() {
      if ($(this).attr('rel') != thisCheck) {
        $(this).iCheck('uncheck');
      }
    })
  });
  $(document.body).on('ifUnchecked','.printManage', function(event) {
    managementAction = $(this).attr('rel');
  });
  $(document.body).on('ifChecked','#toggleToAdd', function(event) {
    $('#printersToAdd').show();
  });
  $(document.body).on('ifUnchecked','#toggleToAdd', function(event) {
    $('#printersToAdd').hide();
  });
}
