<template>
  <div style="display: flex;justify-content: center;align-content: center">
    <div v-if="!isLogin" class="login-plate">
      <h3>账号登陆</h3>
      <form class="login-wrapper" style="display: grid">
        <input v-model="studentID" class="account-input" placeholder="学号" type="text" maxlength="13">
        <input v-model="password" class="password-input" placeholder="密码" type="password">
        <div style="display: flex; flex-direction: row; justify-content: center">
          <input v-model="captcha" class="captcha-input" placeholder="验证码" type="text" maxlength="4">
          <img alt="Captcha image" :src="captchaUrl" @click="refreshCaptcha">
        </div>
        <div class="login-btn" @click="onLoginButtonPressed">
          <div>
            登录
          </div>
        </div>
      </form>
    </div>
    <div v-else>
      <h2>已经登陆过了</h2>
    </div>
  </div>
</template>

<script>


export default {
  name: "LoginView",
  data(){
    return{
      captchaUrl: undefined,
      studentID: "",
      password: "",
      captcha: "",
      isLogin: true,
    }
  },
  mounted() {
    /* eslint-disable*/
    window.ipc.invoke("urp_login_state").then(state=>{
      console.log(JSON.parse(state))
      this.isLogin = JSON.parse(state);
      return JSON.parse(state)
    }).then((isLogin)=>{
      if(!isLogin) {
        window.ipc.invoke("init_urp_login").then(res => {
          this.captchaUrl = URL.createObjectURL(new Blob([res], {type: "image/jpeg"}))
        })
      }
    })

  },
  methods:{
    onLoginButtonPressed(){
      console.log(this.studentID,this.password,this.captcha)
      window.ipc.invoke("post_login_info",JSON.stringify({
        student_id : this.studentID,
        password: this.password,
        captcha: this.captcha
      })).then(res=>{
        console.log(res)
        window.ipc.invoke("urp_login_state",(state)=>{
          this.isLogin = JSON.parse(state)
        })
      })
    },
    async refreshCaptcha(){
      /* eslint-disable*/
      window.ipc.invoke("refresh_captcha").then(data=>{
        this.captchaUrl= URL.createObjectURL(new Blob([data],{type: "image/jpeg"}))
      })
    }
  }
};
</script>

<style scoped>
div.login-plate {
  background: whitesmoke;
  box-shadow: 1px 1px 2px 2px lightgray;
  border-radius: 2%;
}

.login-wrapper > input {
  display: block;
  padding: calc((30px - 1em) / 2) 0.5em;
  border-radius: 5px;

  margin: 1em 3em;

  border-width: 1px;
  border-style: solid;
  border-color: lightgray;

  text-align: center;
}

.login-wrapper > div > input.captcha-input{
  display: inline;

  padding: calc((30px - 1em) / 2) 0.5em;
  border-radius: 5px;

  margin-top: 1em;
  margin-bottom: 2em;

  border-width: 1px;
  border-style: solid;
  border-color: lightgray;

  text-align: center;
  max-width: calc(100% - 7em - 96px);
}
.login-wrapper > div > img {
  display: inline;

  margin-top: 0.875em;
  height: 2em
}

.login-btn{
  display: flex;
  justify-content: center;
}
.login-btn > div {
  display: inline;
  text-align: center;
  height: 2em;
  width: 6em;
  /*padding: 0 5em 1em;*/
  line-height: 2em;

  color: white;
  font-weight: bold;

  background-color: #42b983;
  /*background-clip: content-box;*/

  border: 1px solid lightgray;
  border-radius: 5px;

  margin-bottom: 2em;
  /*margin-top: 1em;*/
}
</style>
