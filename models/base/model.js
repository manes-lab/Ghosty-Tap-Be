function model(schema,tableName){
    let Schema = new require('mongoose').Schema(schema,{collection:tableName});

    Schema.statics.getRowsCount = async function (params) {
        try {
          return await this.count(params);
        } catch (e) {
          console.log(e)
          return null;
        }
    };

    Schema.statics.getRows = async function (params, sort) {
        try {
            return await this.find(params).sort(sort).lean().exec();
        } catch (e) {
            console.log(e)
            return null;
        }
    };
    Schema.statics.getLimitRows = async function (params, sort,limit) {
        try {
            return await this.find(params).sort(sort).limit(limit).lean().exec();
        } catch (e) {
            console.log(e)
            return null;
        }
    };

    Schema.statics.getData = async function (params, sort) {
        try {
            return await this.find(params).lean();
        } catch (e) {
            console.log(e)
            return null;
        }
    };

    Schema.statics.getPagedRows = async function (params, skip, limit, sort) {
        skip = parseInt(skip);
        limit = parseInt(limit);
        try {
          return await this.find(params).sort(sort).skip(skip).limit(limit).lean().exec();
        } catch (e) {
          console.log(e)
          return null;
        }
    };
  Schema.statics.getPagedRowsDistinct = async function (words,params, skip, limit, sort) {
    skip = parseInt(skip);
    limit = parseInt(limit);
    try {
      return await this.getPagedRowsDistinct(words,params).exec();
    } catch (e) {
      console.log(e)
      return null;
    }
  };




    Schema.statics.createRow = async function (params) {
      try {
        return await this.create(params);
      } catch (e) {
        console.log(e)
        return null;
      }
    };

    Schema.statics.getRow = async function (params) {
        try {
          return await this.findOne(params).lean().exec();
        } catch (e) {
          console.log(e)
          return null;
        }
    };

    Schema.statics.updateRow = async function (condition, params) {
        try {
          return await this.updateOne(condition, params);
        } catch (e) {
          console.log(e)
          return null;
        }
    };
  Schema.statics.update = async function (condition, params) {
    try {
      return await this.update(condition, params);
    } catch (e) {
      console.log(e)
      return null;
    }
  };

    Schema.statics.updateRows = async function (condition, params) {
        try {
            return await this.updateMany(condition, params);
        } catch (e) {
            console.log(e)
            return null;
        }
    };


    Schema.statics.updateOrInsertRow = async function (condition, params) {
        try {
          return await this.updateOne(condition, params, { upsert: true });
        } catch (e) {
          console.log(e)
          return null;
        }
    };

    Schema.statics.findOneAndUpdateRow = async function (condition, params) {
        try {
          return await this.findOneAndUpdate(condition, params, {new:true});
        } catch (e) {
          console.log(e)
          return null;
        }
    };

    Schema.statics.deleteRow = async function (condition) {
        try {
          return await this.deleteOne(condition);
        } catch (e) {
          console.log(e)
          return null;
        }
    };
  Schema.statics.deleteRows = async function (condition) {
    try {
      return await this.deleteMany(condition);
    } catch (e) {
      console.log(e)
      return null;
    }
  };

    Schema.statics.getFilteredRows = async function (params, sort, fields) {
        try {
          return await this.find(params).sort(sort).select(fields).lean().exec();
        } catch (e) {
          console.log(e)
          return null;
        }
    };

    Schema.statics.getFilteredPagedRows = async function (params, skip, limit, sort, fields) {
        skip = parseInt(skip);
        limit = parseInt(limit);

        try {
          return await this.find(params).sort(sort).skip(skip).limit(limit).select(fields).lean().exec();
        } catch (e) {
          console.log(e)
          return null;
        }
    };

    Schema.statics.getFilteredRow = async function (params, fields) {
        try {
          return await this.findOne(params).select(fields).lean().exec();
        } catch (e) {
          console.log(e)
          return null;
        }
    };

    Schema.statics.agg = async function (params) {
        try {
          return await this.aggregate(params).exec()
        } catch (e) {
          console.log(e)
          return null;
        }
    };

    Schema.statics.mr = async function (params) {
        try {
          return await this.mapReduce(params)
        } catch (e) {
          console.log(e)
          return null;
        }
    };

    return Schema
}

module.exports = model;
