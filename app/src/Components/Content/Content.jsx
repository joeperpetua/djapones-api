import React from 'react';
import { Switch, Route } from "react-router-dom";
import Home from './Home/Home';
import Search from './Search/Search';
import About from './About/About';
import Auth from './Auth/Auth';
// import NotFound from './NotFound/NotFound';

import "./Content.css";

class Content extends React.Component{

  render(){
      return(
        <div className="Content">
          <Switch>
            <Route path="/about" component={About} />
            <Route path="/search" render={(props) => <Search {...props} firebase={this.props.firebase} />} />
            <Route path="/auth" render={(props) => <Auth {...props} firebase={this.props.firebase} />} />
            <Route path="/" component={Home} />
          </Switch>
        </div>
      );
  }
    
}

export default Content;