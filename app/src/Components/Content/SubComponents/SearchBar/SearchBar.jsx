import React from 'react';
import './SearchBar.css';

class SearchBar extends React.Component{
    constructor(props){
        super(props);
        this.toggleLang = this.toggleLang.bind(this);
        this.toggleTooltip = this.toggleTooltip.bind(this);
        this.state = {
            tooltip: this.props.tooltip
        };
    }

    componentWillMount(){

    }

    toggleLang(lang){
        switch(lang){
            case 'ESP':
                document.getElementsByClassName('search-lang')[0].innerHTML = 'JAP';
                document.getElementsByClassName('search-btn-esp')[0].classList.toggle("search-btn-jap");
                document.getElementsByClassName('search-btn-esp')[0].classList.toggle("search-btn-esp");
                break;

            case 'JAP':
                document.getElementsByClassName('search-lang')[0].innerHTML = 'ESP';
                document.getElementsByClassName('search-btn-jap')[0].classList.toggle("search-btn-esp");
                document.getElementsByClassName('search-btn-jap')[0].classList.toggle("search-btn-jap");
                break;
            
            default:
                console.log('unknown lang');
                break;
        }
    }

    toggleTooltip(){
        document.getElementsByClassName('tooltiptext')[0].classList.toggle("hidden");
    }

    render(){
        console.log(this.state.tooltip);

        return(
            <div>
                <div className="search-bar">
                    <input className="search-input" type="text"/>
                    <div className="search-btn-esp">
                        <button onClick={(e) => {this.toggleLang(e.target.innerHTML)}} className="search-lang">ESP</button>
                        <button className="search-search">
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