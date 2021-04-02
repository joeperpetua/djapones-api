import React from 'react';
import './SearchBar.css';

class SearchBar extends React.Component{
    constructor(props){
        super(props);
        this.toggleLang = this.toggleLang.bind(this);
        this.toggleTooltip = this.toggleTooltip.bind(this);
        this.search = this.search.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this); 
        this.state = {
            tooltip: this.props.tooltip,
        };
    }

    toggleLang(lang){
        switch(lang){
            case 'ESP':
                document.getElementsByClassName('search-lang')[0].innerHTML = 'JAP';
                document.getElementsByClassName('search-btn-ESP')[0].classList.toggle("search-btn-JAP");
                document.getElementsByClassName('search-btn-ESP')[0].classList.toggle("search-btn-ESP");
                break;

            case 'JAP':
                document.getElementsByClassName('search-lang')[0].innerHTML = 'ESP';
                document.getElementsByClassName('search-btn-JAP')[0].classList.toggle("search-btn-ESP");
                document.getElementsByClassName('search-btn-JAP')[0].classList.toggle("search-btn-JAP");
                break;
            
            default:
                console.log('unknown lang');
                break;
        }
    }

    toggleTooltip(){
        document.getElementsByClassName('tooltiptext')[0].classList.toggle("hidden");
    }

    search(){
        let src = document.getElementsByClassName('search-lang')[0].innerHTML;
        let word = document.getElementsByClassName('search-input')[0].value;
        if(src === 'ESP'){
            window.location.pathname = `search/es/${word}`;
        }
        
        if(src === 'JAP'){
            window.location.pathname = `search/jp/${word}`;
        }
        
    }

    handleKeyDown(event) {
        if(event.keyCode === 13) { 
            this.search();
        }
    }

    render(){
        let lastLang = 'JAP';
        let lastQuery = '';
        if(this.props.lang === 'es'){
            lastLang = 'ESP';
        }
        if(this.props.query){
            lastQuery = decodeURI(this.props.query);
        }

        return(
            <div>
                <div className="search-bar">
                    <input onKeyDown={this.handleKeyDown} className="search-input" type="text" defaultValue={lastQuery} />
                    <div className={`search-btn-${lastLang}`}>
                        <button onClick={(e) => {this.toggleLang(e.target.innerHTML)}} className="search-lang">{lastLang}</button>
                        <button onClick={this.search} className="search-search">
                            <span className="material-icons">search</span>
                        </button>
                    </div>
                    <div onClick={this.toggleTooltip} className="tooltip unselectable">
                        <span className="material-icons">help_outline</span>
                        <span className={`tooltiptext ${this.state.tooltip}`}>Haz click para en le botón de idioma para cambiar entre lenguajes antes de la busqueda!</span>
                    </div>
                </div>
            </div>
        );
    };
}

export default SearchBar;