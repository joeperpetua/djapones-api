import React from 'react';
import SearchBar from '../SubComponents/SearchBar/SearchBar';

class Search extends React.Component{

    render(){
        return(
            <div>
                <SearchBar tooltip='hidden' />
            </div>
        );
    };
}

export default Search;