import React from 'react';

class Auth extends React.Component{
    constructor(props){
        super(props);
        this.auth = this.auth.bind(this);
        this.logout = this.logout.bind(this);
        this.state = {
            logged: false,
            user_uid: null,
            user_refreshToken: null,
            user_email: null
        };
    }

    componentDidMount() {
        const firebase = this.props.firebase;
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.setState({
                    logged: true,
                    user_uid: user.uid,
                    user_refreshToken: user.refreshToken,
                    user_email: user.email
                });
                console.log(this.state.user_uid);
            } else {
                this.setState({
                    logged: false,
                    user_uid: null,
                    user_refreshToken: null,
                    user_email: null
                });
                console.log('log');
            }
        });
    }

    auth(){
        const firebase = this.props.firebase;
        let email = document.getElementById('email').value;
        let pass = document.getElementById('pass').value;
        firebase.auth().signInWithEmailAndPassword(email, pass).then(()=>{
            localStorage.setItem('logged', true);
        }).catch(function(error) {
            // Handle Errors here.
            console.log(error);
        });
    }

    logout(){
        const firebase = this.props.firebase;
        firebase.auth().signOut().then(()=>{
            localStorage.removeItem('logged');
          }).catch(function(error) {
            console.log(error);
        });
    }

    render(){
        let msg = ``;
        let form = ``;
        console.log(this.state.user_uid);

        if(localStorage.getItem('logged')){
            msg = `logged`;
            form = 
                <div>
                    <button onClick={this.logout}>Logout</button>
                </div>
            ;
        }else{
            msg = `not logged`;
            form = 
                <div>
                    <input type="text" id="email"></input>
                    <br></br>
                    <input type="password" id="pass"></input>
                    <br></br>
                    <button onClick={this.auth}>Login</button>
                </div>
            ;
        }

        return(
            <div>
                <h1>Auth</h1>
                <p>{msg}</p>
                {form}
                <p>{this.state.user_uid}</p>
            </div>
            
        );
    }
}

export default Auth;
