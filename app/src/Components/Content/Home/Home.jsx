import React from 'react';
import SearchBar from '../SubComponents/SearchBar/SearchBar';

class Home extends React.Component{

    render(){

        return(
            <div>
                <h2>Ingresar término en español, romaji o japonés:</h2>
                <SearchBar tooltip='show' />
            </div>
        );
    };
}

export default Home;