let glob = require("glob")
let util = require('util')
let mongoose = require('mongoose');

let middleware = module.exports = options => {
    mongoose = options.mongoose ? options.mongoose : mongoose

    middleware.models = {}
    if (options.schemas) {
      mongoose.Promise = global.Promise;
        middleware.db = mongoose.connect(options.host, function(err){
              if (err) throw err;
              console.log('# mongodb connected.');
           }
        );

        let schemas = options.schemas + (options.schemas.lastIndexOf('/') === (options.schemas.length - 1) ? '' : '/')
        let files = glob.sync(schemas + '/*.js')
        files.map(file => {
            let path = require('path');
            let model = path.basename(file, '.js').toLowerCase();
            let schema = require(file)
            middleware.models[model] = mongoose.model(model, schema)
        });
    }

    return async function(ctx, next) {
        ctx.model = model => {
            try {
                return middleware.model(middleware.db, model)
            } catch(err) {
                ctx.throw(400, err.message)
            }
        }
        //ctx.grid= Grid(middleware.db,mongoose.mongo);
    /*    ctx.conn = middleware.db
        ctx.mongo=mongoose.mongo*/
        ctx.document = (model, document) => new (ctx.model(model))(document)
        await
            next()
    }
}

middleware.model = (database, model) => {
    let name = model.toLowerCase()
    if (!middleware.models.hasOwnProperty(name)) {
        throw new Error(util.format('Model not found: %s.%s', database, model))
    }
    return mongoose.model(model, middleware.models[name].schema)
}

middleware.document = (database, model, document) => new (middleware.model(database, model))(document)
middleware.mongoose = mongoose
