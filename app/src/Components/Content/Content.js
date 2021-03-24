import React from 'react';
import { Switch, Route } from "react-router-dom";
import Home from './Home/Home';
import Search from './Search/Search';
import About from './About/About';
// import NotFound from './NotFound/NotFound';

class Content extends React.Component{
  
    render(){
        return(
          <Switch>
            <Route path="/about" component={About} />
            <Route path="/search" component={Search} />
            <Route path="/" component={Home} />
          </Switch>
        );
    }
    
}

export default Content;