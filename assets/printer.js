// FOG Printer
$.fogPrinter = {};

$.fogPrinter.Create = function() {
  var toSend = {};
  toSend.pluginData = {};
  toSend.data = $.fogPrinter.GetPrinterData('');
  toSend.action = 'printer';
  toSend.task = 'create';
  $.fogDashBoard.GetSocketData('/printer',
  toSend,function(fromServer) {
    if (fromServer.uid != null) {
      toSend.data.uid = fromServer.uid
    }
    if (fromServer.message == 'success') {
      $.fogPrinter.PopulateUpdateForm(toSend.data);
      $('#createForm').trigger('reset');
      $('.subPageContainer').hide();
      $.fogDashBoard.BreadCrumb('FOG Printer','Edit Printer ' + data.name,mainView);
      $('#edit').fadeIn();
      $.fogDashBoard.ShowMessage('Printer Created',
      'The Printer ' + data.name + 'was Created',false,null,'success');
    } else {
      $.fogDashBoard.ShowMessage('Error Host Not Created',
      fromServer.error,false,null,'error');
    }
  });
}

$.fogPrinter.PopulateUpdateForm = function(dataIn) {
  $('#uuid').val(dataIn.uid);
  $('#uprintername').val(dataIn.name);
  $('#uprintertype').select2().val(dataIn.type).trigger('change');
  $('#u' + dataIn.type + 'Printer').show();
  $('#uprinterDesc').val(dataIn.vars.description);
  toAppend = dataIn.type;
  if (dataIn.type == 'iprint') {
    $('#u' + toAppend + 'alias').val(dataIn.vars.alias);
    $('#u' + toAppend + 'port').val(dataIn.vars.port);
  } else if (dataIn.type == 'ip') {
    $('#u' + toAppend + 'alias').val(dataIn.vars.alias);
    $('#u' + toAppend + 'port').val(dataIn.vars.port);
    $('#u' + toAppend + 'ip').val(dataIn.vars.ip);
    $('#u' + toAppend + 'model').val(dataIn.vars.model);
    $('#u' + toAppend + 'inf').val(dataIn.vars.inf);
  } else if (dataIn.type == 'network') {
    $('#u' + toAppend + 'path').val(dataIn.vars.path);
  } else if (dataIn.type == 'cups') {
    $('#u' + toAppend + 'alias').val(dataIn.vars.alias);
    $('#u' + toAppend + 'ip').val(dataIn.vars.ip);
    $('#u' + toAppend + 'inf').val(dataIn.vars.inf);
  }
}

$.fogPrinter.Update = function() {
  var toSend = {};
  toSend.data = $.fogPrinter.GetPrinterData('u');
  toSend.action = 'printer';
  toSend.task = 'update';
  didSucceed = false;
  $.fogDashBoard.GetSocketData('/printer',
  toSend,function(fromServer) {
    console.log(fromServer);
    if (fromServer.message == 'success') {
      $.fogDashBoard.ShowMessage('Printer Update',
      'The Printer ' + data.name + ' was Updated',false,null,'success');
    } else {
      $.fogDashBoard.ShowMessage('Error Printer Not Updated',
      fromServer.message,false,null,'error');
    }
  });
}

$.fogPrinter.GetPrinterData = function(toAppend) {
  newData = {};
  newData.name = $('#' + toAppend + 'printername').val();
  type = $('#' + toAppend + 'printertype').val();
  newData.type  = type;
  vars = {};
  vars.description = $('#' + toAppend + 'printerDesc').val();
  toAppend = toAppend + newData.type;
  if ($('#' + toAppend + 'uid').val() != null) {
    newData.uid = $('#' + toAdd + 'uid').val();
  }
  if (type == 'iprint') {
    vars.alias = $('#' + toAppend + 'alias').val();
    vars.port = $('#' + toAppend + 'port').val();
  } else if (type == 'ip') {
    vars.alias = $('#' + toAppend + 'alias').val();
    vars.port = $('#' + toAppend + 'port').val();
    vars.ip = $('#' + toAppend + 'ip').val();
    vars.model = $('#' + toAppend + 'model').val();
    vars.inf = $('#' + toAppend + 'inf').val();
  } else if (type == 'network') {
    vars.path = $('#' + toAppend + 'path').val();
  } else if (type == 'cups') {
    vars.alias = $('#' + toAppend + 'alias').val();
    vars.ip = $('#' + toAppend + 'ip').val();
    vars.inf = $('#' + toAppend + 'inf').val();
  }
  newData.vars = vars;
  return newData;
}

$.fogPrinter.getSelect = function() {
  $('.fogPrinterOptions').hide();
  $('#' + $('#printertype').val() + 'Printer').show();
}

$.fogPrinter.BuildConfirm = function() {
  $('#confirmPrinterType').html($('#printertype option:selected').text());
  $('#confirmPrinterName').html($('#printername').val());
  $('#confirmPrinterDesc').html($('#printerDesc').val());
}

$.fogPrinter.BuildControls = function() {
  if (loadFunction != '') {
    if (loadFunction == 'search') {
      $.fogPrinter.setUpSearch();
    } else if (loadFunction == 'list') {
      $.fogPrinter.ListAll();
    }
    loadFunction = '';
  }
  $(document.body).on('click','.printerTask',function(e) {
    thisAction = $(this).attr('rel');
    if (thisAction == 'delete') {
      $.fogDashBoard.ShowMessage('Delete Printer',
      'Are you sure you want to delete the 1 Printer?',
      true,function() {
        toDelete = [];
        toDelete.push($(this).closest('tr.fogTableRow').attr('rel'));
        $.fogPrinter.DeletePrinter(toDelete,function(didPass) {
          if (didPass == true) {
            $(this).closest('tr.fogTableRow').remove();
          }
        })
      },'warning')
    }
  });
  $('#printerSubmit').click(function() {
    $.fogPrinter.Update();
  })
  $('#printerDelete').click(function() {
    $.fogPrinter.Delete($('#uuid').val());
  })
  $('#btnPrinterDelete').click(function() {
    if ($('.selectedRow').length > 0) {
      $.fogDashBoard.ShowMessage('Delete Printer',
      'Are you sure you want to delete the ' + $('.selectedRow').length + ' Printer(s)?',
      true,function() {
        toDelete = [];
        $('.selectedRow').each(function() {
          toDelete.push($(this).attr('rel'));
        })
        console.log(toDelete);
        $.fogPrinter.DeletePrinter(toDelete,function(didPass) {
          if (didPass == true) {
            $('.selectedRow').each(function() {
              $(this).remove();
            })
          }
        })
      },'warning')
    }
  })
}

$.fogPrinter.CheckPrinterCreate = function() {
  didValidate = true;
  return true;
}

$.fogPrinter.ListAll = function() {
  var toSend = {};
  var printerTable = '<table id="printerListTable"'
  toSend.action = 'printer';
  toSend.task = 'list';
  $.fogDashBoard.GetSocketData('/printer',
  toSend,function(fromServer) {
    printers = fromServer.list;
    $.fogPrinter.BuildTable($('#printerTableView'),printers,'printerListTable',printerTableDefaults);
  });
  $('#printerTableView').show();
}

$.fogPrinter.BuildTable = function(container,data,tableName,tableOptions) {
  $.fogDashBoard.BuildTable(container, data, tableOptions)
}

printerTableDefaults = {};
printerTableDefaults.tableName = 'printerListTable';
printerTableDefaults.container = '#printerTableView';
printerTableDefaults.tableOptions = {
  paging: true,
  lengthChange: false,
  searching: true,
  ordering: true,
  info: true,
  autoWidth: false,
}
printerTableDefaults.dblClick = function(thisuid) {
  toSend = {};
  toSend.action = 'printer';
  toSend.task = 'get';
  toSend.uid = thisuid;
  $.fogDashBoard.GetSocketData('/printer',
  toSend,function(fromServer) {
    data = fromServer.printer[0];
    $.fogPrinter.PopulateUpdateForm(data);
    $('.subPageContainer').hide();
    $.fogDashBoard.BreadCrumb('FOG Printer',
    'Edit Printer ' + data.name,mainView);
    $('#edit').fadeIn();
  });
}

printerTableDefaults.columns = ['Name','Type','Tasks'];
printerTableDefaults.dataMap = ['name',function(myData) {
  if (myData.type == 'iprint') {
    return 'iPrint Printer';
  } else if (myData.type == 'ip') {
    return 'IP Printer';
  } else if (myData.type == 'network') {
    return 'Network Printer';
  } else if (myData.type == 'cups') {
    return 'CUPS Printer';
  }
},function() {
  output = '<div class="tableTaskContainer">\
  <div class="tableTask printerTask fa fa-trash fa-1x" title="Delete" rel="delete"></div></div>';
  return output;
},];
printerTableDefaults.menu = {};
printerTableDefaults.menu.items = {
  edit: {name: 'Edit', icon: 'edit'},
  delete: {name: 'Delete', icon: 'delete'},
}
printerTableDefaults.menu.callback = function(key,options,row) {
  $.fogPrinter.ContextCB(key,options,row);
}
$.fogPrinter.DeletePrinter = function(selected,myCB) {
  var toSend = {};
  toSend.action = 'printer';
  toSend.task = 'delete';
  toSend.delete = selected;
  $.fogDashBoard.GetSocketData('/printer',
  toSend,function(fromServer) {
    if (fromServer.message == 'success') {
      $.fogDashBoard.ShowMessage('Printer Deletion',
      'The Printer(s) where deleted',false,null,'success');
      myCB(true);
    } else {
      $.fogDashBoard.ShowMessage('Error Printer(s) Not Deleted',
      fromServer.message,false,null,'error');
      myCB(false);
    }
  });

}
$.fogPrinter.ContextCB = function(key,options,row) {
  thisuid = $(row).attr('rel');
  $(row).addClass('selectedRow');
  if (key == 'edit') {
    toSend = {};
    toSend.action = 'printer';
    toSend.task = 'get';
    toSend.uid = thisuid;
    $.fogDashBoard.GetSocketData('/printer',
    toSend,function(fromServer) {
      data = fromServer.printer[0];
      $.fogPrinter.PopulateUpdateForm(data);
      $('.subPageContainer').hide();
      $.fogDashBoard.BreadCrumb('FOG Printer',
      'Edit Printer ' + data.name,mainView);
      $('#edit').fadeIn();
    });
  } else if (key == 'delete') {
    if ($('.selectedRow').length > 0) {
      $.fogDashBoard.ShowMessage('Delete Printer',
      'Are you sure you want to delete the ' + $('.selectedRow').length + ' Printer(s)?',
      true,function() {
        toDelete = [];
        $('.selectedRow').each(function() {
          toDelete.push($(this).attr('rel'));
        })
        console.log(toDelete);
        $.fogPrinter.DeletePrinter(toDelete,function(didPass) {
          if (didPass == true) {
            $('.selectedRow').each(function() {
              $(this).remove();
            })
          }
        })
      },'warning')
    }
  }
}
