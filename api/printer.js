var printerAPI = {};

printerAPI.entry = function(req, res) {
  var toDo = req.param('task');
  var data = req.param('data');
  var outPut = {};
  switch (toDo){
    case 'create': {
      api.printer.create(data,function(err,created) {
        if (!err) {
          outPut.uid = created.uid;
          outPut.message = 'success';
        } else {
          outPut.message = 'error';
          console.log(err);
          outPut.error = err;
        }
        res.json(outPut);
      })
      break;
    }
    case 'update': {
      api.printer.update(data,function(err,created) {
        if (!err) {
          outPut.uuid = created.uid;
          outPut.message = 'success';
        } else {
          outPut.message = 'error';
          outPut.error = err.invalidAttributes.name[0].message;
        }
        res.json(outPut);
      })
      break;
    }
    case 'list': {
      api.printer.listAll(function(err,found) {
        if (!err) {
          res.json({
            message: 'success',
            list: found,
          });
        } else {
          res.json({
            message: 'error',
            error: err.invalidAttributes.name[0].message,
          })
        }
      })
      break;
    }
    case 'get': {
      var uidIn = req.param('uid');
      api.printer.get(uidIn,function(err,found) {
        if (!err) {
          res.json({
            message: 'success',
            printer: found,
          });
        } else {
          res.json({
            message: 'error',
            error: err.invalidAttributes.name[0].message,
          })
        }
      })
      break;
    }
    case 'delete': {
      var toDelete = req.param('delete');
      api.printer.delete(toDelete,function(err,found) {
        api.printer.deleteFromHost(toDelete);
        api.printer.deleteFromGroup(toDelete);
        if (!err) {
          res.json({
            message: 'success',
          });
        } else {
          res.json({
            message: 'error',
          })
        }
      })
      break;
    }
    case 'parse': {
      uuid = req.param('uid');
      type = req.param('type');
      api.printer.GetPrinterList(uuid,type,function(data) {
        console.log('got data: ' + data);
        if (data == 'error') {
          res.json({
            message: 'error',
          })
        } else {
          res.json({
            printers: data,
          })
        }
      })
    }
  }
}

printerAPI.GetPrinterList = function(uuid,type,myCB) {
  if (type == 'group') {
    Group.find({uid: uuid}).exec(function(err,found) {
      if (!err || found.length == 1) {
        found = found[0];
        if (found.pluginData.printers != null) {
          myCB(found.pluginData.printers)
        } else {
          myCB({printers: [],default: ''});
        }
      } else {
        myCB('error');
      }
    })
  } else if (type == 'host') {
    api.host.get(uuid,function myFunc(err,found) {
      newArr = {}
      if (!err && found.length == 1) {
        found = found[0];
        if (found.pluginData.printers != null) {
          newArr = found.pluginData.printers;
        } else {
          newArr = {printers: [],default: ''};
        }
        newArr.inherited = [];
        // OK lets do the BS of adding group printers
        // Lets see if Host has any groups
        if (found.pluginData.groups != null) {
          // OK it Does lets parse them in async
          async.forEach(found.pluginData.groups, function(groupid,callback) {
            Group.find({uid: groupid}).exec(function(err,found) {
              found = found[0];
              if (!err) {
                if (found.pluginData.printers.printers != null) {
                  found.pluginData.printers.printers.forEach(function(printer) {
                    if (newArr.printers.indexOf(printer) != -1) {
                      newArr.printers.push(printer);
                      newArr.inherited.push(printer);
                    }
                  })
                }
                // Check Default printer
                if (newArr.default == '') {
                  defaultPrinter = found.pluginData.printers.default;
                  if (defaultPrinter != null  && defaultPrinter != '') {
                    newArr.default = found.pluginData.printers.default;
                  }
                }
              }
              callback();
            })
          },function() {
            myCB(newArr);
          })
        }
        myCB(newArr);
      } else {
        myCB('error');
      }
    })
  }
}

printerAPI.ParsetoJSON = function(list,myCB) {
  output = [];
  async.forEach(list, function(printer, callback) {
    Printer.find({uid: printer}).exec(function(err,found) {
      if (found.length == 1) {
        found = found[0];
        output.push(found);
      }
    })
  },function() {
    myCB(output);
  })
}

printerAPI.delete = function(toDelete,myCB) {
  async.forEach(toDelete, function(item, callback) {
    Printer.destroy({uid: item}).exec(function deleteCB(err) {
      bus.emit('printer.delete',item,function myCB(returned) {
        callback();
      });
    });
  }, function(err) {
    myCB(err);
  });
}

printerAPI.create = function(data, cb) {
  api.generate.uuid(Host, function(result) {
    data.uid = result;
    Printer.create(data).exec(function createCB(err, created) {
      bus.emit('printer.create',created,function myCB(returned) {
        cb(err,created);
      });
    });
  })
};

printerAPI.get = function(uidIn,cb) {
  Printer.find({uid: uidIn}).exec(function findCB(err, found) {
    cb(err, found);
  });
}

printerAPI.update = function(data, cb) {
  Printer.update({uid: data.uid},data).exec(function afterwards(err, updated) {
    bus.emit('Printer.changed',updated,function myCB(returned) {
      api.printer.informChangetoHost(data.uid);
      api.printer.informChangetoGroup(data.uid);
      cb(err,updated);
    });
  });
};

printerAPI.informChangetoHost = function(thisID) {
  Host.find({'pluginData.printers.printers': thisID})
    .exec(function(err,found) {
      found.forEach(function(host) {
        api.client.informHost(host.uid,'printer',thisID);
      })
    })
}

printerAPI.informChangetoGroup = function(thisID) {
  Group.find({'pluginData.printers.printers': thisID})
    .exec(function(err,found) {
      found.forEach(function(group) {
        api.client.informGroup(group.uid,'printer',thisID);
      })
    })
}

printerAPI.deleteFromHost = function(toDelete) {
  Host.find({'pluginData.printers.printers': toDelete})
    .exec(function(err,found) {
    found.forEach(function(host) {
      thisData = host.pluginData;
      newPrinters = [];
      thisData.printers.printers.forEach(function(printer) {
        if (printer != toDelete) {
          newPrinters.push(printer);
        }
      })
      if (thisData.printers.default == toDelete) {
        thisData.printers.default = '';
      }
      thisData.printers.printers = newPrinters;
      Host.update({uid: host.uid,pluginData: thisData})
      .exec(function(err, found) {
        if (!err) {
          api.fog.log('Printer Removed from Host','info');
        } else {
          api.fog.log(err,'warning');
        }
        api.client.informHost(host.uid,'printer',host);
      })
    })
  })
}

printerAPI.deleteFromGroup = function(toDelete) {
  Group.find({'pluginData.printers.printers': toDelete})
    .exec(function(err,found) {
    found.forEach(function(group) {
      thisData = group.pluginData;
      newPrinters = [];
      thisData.printers.printers.forEach(function(printer) {
        if (printer != toDelete) {
          newPrinters.push(printer);
        }
      })
      if (thisData.printers.default == toDelete) {
        thisData.printers.default = '';
      }
      thisData.printers.printers = newPrinters;
      Group.update({uid: group.uid,pluginData: thisData})
      .exec(function(err, found) {
        if (!err) {
          api.fog.log('Printer Removed from Group','info');
        } else {
          api.fog.log(err,'warning');
        }
        api.client.informGroup(group.uid,'printer',host);
      })
    })
  })
}

printerAPI.find = function(data, cb) {
  Printer.find(data).exec(function findCB(err, found) {
    cb(err, found);
  });
};

printerAPI.listAll = function(cb) {
  Printer.find({}).exec(function myCB(err,found) {
    cb(err,found);
  })
}

module.exports = printerAPI;
