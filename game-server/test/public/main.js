const pomelo = window.pomelo

const username = "123"
const rid = "btc"
console.log(window.pomelo)

pomelo.init({
  host: "13.228.213.110", port: 3050, log: true
}, function () {
  var route = "connector.entryHandler.enter";
  pomelo.request(route, {
    "type": "adventure",
    "tradingPair": "Bitcoin",
    user_id:"6892280766",
    "game_id": "668bc8550b04a6e093a13e5c",
    "dataCheckString": "user=%7B%22id%22%3A6892280766%2C%22first_name%22%3A%22olina%22%2C%22last_name%22%3A%22Li%22%2C%22username%22%3A%22olina_ly%22%2C%22language_code%22%3A%22zh-hans%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=63019429428588741&chat_type=private&auth_date=1720076471&hash=9d70b4183b0c2e845ef1f4f9343ec4cd2362598fbdef5cc37cc6f55baeafaa63",
    "timestamp": 1720078723468
  }, function (data) {



    var route = "space.base.submitZenGameData";
    pomelo.request(route, {
      "type": "adventure",
      "tradingPair": "Bitcoin",
      user_id:"6892280766",
      "game_id": "668bc8550b04a6e093a13e5c",
      "dataCheckString": "user=%7B%22id%22%3A6892280766%2C%22first_name%22%3A%22olina%22%2C%22last_name%22%3A%22Li%22%2C%22username%22%3A%22olina_ly%22%2C%22language_code%22%3A%22zh-hans%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=63019429428588741&chat_type=private&auth_date=1720076471&hash=9d70b4183b0c2e845ef1f4f9343ec4cd2362598fbdef5cc37cc6f55baeafaa63",
      "timestamp": 1720078723468
    }, function (data) {
      if (data.error) {
        console.log(data.error)
        return;
      }
      console.log(data)
    });





    if (data.error) {
      console.log(data.error)
      return;
    }
    console.log(data)
  });
});

