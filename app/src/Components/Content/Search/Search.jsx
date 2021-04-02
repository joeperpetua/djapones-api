import React from 'react';
import SearchBar from '../SubComponents/SearchBar/SearchBar';
import ResultCard from '../SubComponents/ResultCard/ResultCard';

class Search extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            request: window.location.pathname.split('/').splice(-2),
            error: null,
            isLoaded: false,
            results: []
        }
    }

    componentDidMount() {
        fetch(`http://localhost:7000/?src=${this.state.request[0]}&word=${this.state.request[1]}`)
          .then(res => res.json())
          .then(
            (response) => {
                if(response.code != 200){
                    this.setState({
                        isLoaded: true,
                        error: response.error
                    });
                }else{
                    this.setState({
                        isLoaded: true,
                        results: response.data[1]
                    });
                }
            },
        )
    }

    render(){
        const { request, error, isLoaded, results } = this.state;
        console.log(request);
        if (error) {
            return (
                <div>
                    <SearchBar tooltip='hidden' query={this.state.request[1]} lang={this.state.request[0]} />
                    <div>{error}</div>
                </div>
            );
        } else if (!isLoaded) {
            return (
                <div>
                    <SearchBar tooltip='hidden' query={this.state.request[1]} lang={this.state.request[0]} />
                    <div>Loading...</div>
                </div>
            );
        } else {
            return (
                <div>
                    <SearchBar tooltip='hidden' query={this.state.request[1]} lang={this.state.request[0]} />
                    {results.map(result => (
                        <ResultCard key={result.kana} data={result} />
                    ))}
                </div>
            );
        }
    };
}

export default Search;