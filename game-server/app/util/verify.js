const crypto = require("crypto");
function auth ( apiToken, initData ) {
    const data = initData
    data.sort();
    const hash = data.get( "hash" );
    data.delete( "hash" );

    const dataToCheck = [...data.entries()].map( ( [key, value] ) => key + "=" + value ).join( "\n" );
    {
      const secretKey = crypto.createHmac( "sha256", "WebAppData" ).update( apiToken ).digest();
      const gHash = crypto.createHmac( "sha256", secretKey ).update( dataToCheck ).digest( "hex" );
      if (hash === gHash){
        return true
      }
    }
    return false;
}

function verify(token, initData) {
  if (!auth(token, initData)) {
      return false
  }
  return true
}

module.exports = {
  verify
}
