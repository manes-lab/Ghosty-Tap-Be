module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */

  apps : [
    {
      name      : 'tegen_tab_server',
      script    : 'index.js',
      instances : "1",
      exec_mode : "fork",
      autorestart: true,
      cron_restart:"20 0 * * *",
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_dev : {
        NODE_ENV: 'dev'
      },
      env_test : {
        NODE_ENV: 'test'
      },
      env_main : {
        NODE_ENV: 'main'
      },

      env_timer : {
        NODE_ENV: 'timer'
      }
    }
  ]
};
