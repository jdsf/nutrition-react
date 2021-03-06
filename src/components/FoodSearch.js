import React, {Component} from 'react';
import Button from "./Button";
import FoodFocus from "./FoodFocus";
import FoodItem from "./FoodItem";

import {TransitionGroup, CSSTransition} from 'react-transition-group';
import loading from '../assets/wedges-loading.svg';
import magni from '../assets/magnifying.png';

class FoodSearch extends Component {

  constructor(props){
    super(props);

    this.state = {
      key: "U1gJ9CuAZPIkNOqFxeKfI7jOat1RPYwUj5gbTsjf",
      foodComponents: {error: null, isLoaded: false, list: []},
      rawCallData: null,
      search: "",
      focus: {id: "", name: ""},
      myFood: props.myFood,
      bg: {isLoaded: false, style: "hidden"}
    };
  }

  // When triggered sends a copy of the api call to parent.
  saveData = (jsonData) => {
    this.props.saveCall(jsonData);
  }


  //  Updates state based on user input. The search input then can be
  // used to update the food display.
  updateSearch(event) {
    this.setState({
      search: event.target.value
    });
  }


  // onClick unction for food items. When clicked, change state to remember
  // the food name and id.
  findFood = (id, name) => {
    this.setState({
      focus: {id: id, name: name}
    });
  }


  updateFoodList = () => {
    let callData = this.state.rawCallData;
    if (callData !== null) {
      let newFoodComponents = this.showFoodItems(callData.list.item);
      this.setState({
        foodComponents: {isLoaded: true, list: newFoodComponents}
      });
    }
  }

  addFood = (foodString) => {
    this.props.addFood(foodString);
    this.updateFoodList();
  }


  // Helper function to process API data. Takes JSON format object and
  // returns the food items inside an unordered list of list jsx.
  showFoodItems = (foodList) => {
    let foodItems = [];
    let inner = [];
    let list = this.state.myFood;
    for (let i = 0; i < foodList.length; i++) {
      let info = foodList[i].name;
      if (!info.includes('\\') && !info.includes("!") &&
          !info.includes('""'))  {
        info = info.slice(0, info.indexOf("UPC") - 2);
        info = info.toLowerCase();
        let check = false;
        for (let i = 0; i < list.length; i++) {
          if (list[i].name.toLowerCase() === info) {
            check = true;
          }
        }
        let item;
        item = ((
          <FoodItem
             click= {this.findFood.bind(this)}
             id = {foodList[i].id}
             key = {foodList[i].id}
             check = {check}
           >
             {info}
           </FoodItem>
          ));

        inner.push(item);
      }
    }
    foodItems.push(<ul key = "wassup">{inner}</ul>);
    return foodItems;
  }

  // Commences the API fetch, calls function helper function
  // showFoodItems to process the API response into a presentable format.
  // Updates state based on response.
  loadSearch = () => {
    if (this.state.foodComponents.list.length === 0  ) {
      let listType = "f"; // food
      let url = "https://api.nal.usda.gov/ndb/list?" +
        "format=json" +
        "&lt=" + listType +
        "&max=" + 100 +
        "&api_key=" + this.state.key;


      fetch(url, {signal: this.abortController.signal })
        .then( (response) => {
          return response.json();
        })
        .then( (jsonRes) =>  {
          this.saveData(jsonRes);
          let newFoodComponents = this.showFoodItems(jsonRes.list.item);
          this.setState({
            foodComponents: {isLoaded: true, list: newFoodComponents},
            bg: {isLoaded: true, style: "visible"}
          });
      })
      .catch(error => {
        if (error.name === 'AbortError'){
          return;
        } else {
          this.setState({
            foodComponents: {isLoaded: true, error: error}
          });
        }
      })
    }
  }

  // onLoad for background, updates state to signal background is ready
  handleBgLoad = () => {
  }

  // Based on state, arrange the jsx UI.
  buildView = () => {
    let section;
    let {error, isLoaded, list} = this.state.foodComponents;
    if (error) {
      section = (
        <div id = "error">
          <h1> Error: there was a problem connecting to the web </h1>
        </div>
      );
    } else {
        let filteredFood = [];
        if(this.state.search !== ""){
          filteredFood.push(list[0].props.children.filter(
            (food) => {
              return food.props.children.includes(this.state.search.toLowerCase());
            }
          ));
          section = (
            <div id = "food-list-container">
              <h1> Food List </h1>
              <div className="food-list scrollable">
                {filteredFood[0].length === 0 ?
                  <h1> No such food!  </h1> :
                  <ul >{filteredFood}</ul>
                }
              </div>
            </div>
          );
        } else {
          section = (
            <div id = "food-list-container">
              <h1>Food List</h1>
              <div className="food-list scrollable">
                {list}
              </div>
            </div>
          );
        }
    }
    return section;
  }


  componentDidMount() {
    let rawData = this.props.savedData;
    if (rawData !== null) {
      let newFoodComponents = this.showFoodItems(rawData.list.item);
      if (this.state.bg.isLoaded) {
        this.setState({
          foodComponents: {isLoaded: true, list: newFoodComponents},
          bg: {isLoaded: true, style: "visible"}
        });
      } else {
        this.setState({
          foodComponents: {isLoaded: true, list: newFoodComponents},
          bg: {isLoaded: true, style: "visible"}
        });
      }
    } else {
      this.loadSearch();
    }
  }

  componentWillReceiveProps(newProps) {
    let rawData = newProps.savedData;
    if (rawData != this.state.rawCallData) {
      this.setState({
        rawCallData: rawData
      });
    }
  }

  componentWillUnmount() {
    this.abortController.abort();
  }

  abortController = new window.AbortController();

  render() {
    let display;

    let bgStyle = {
      visibility: this.state.bg.style
    };
    let background = (
      <div id = "foodlist-bg"
        style = {bgStyle}
      >
      </div>
    );
    if ( !this.state.foodComponents.isLoaded || !this.state.bg.isLoaded) {
      display = (
        <div id = "loading">
          <img src = {loading}/>
          <h1>
            Loading, please wait...
          </h1>
          {background}
        </div>
      );
    } else {
      let section;
      section = this.buildView();
      let focusSection;
      focusSection = ((this.state.focus.id !== "") ?
          <FoodFocus
            addFood = {this.addFood.bind(this)}
            goToMyFoods = {this.props.toMyFood}
            name = {this.state.focus.name}
            id = {this.state.focus.id}
          /> : undefined
       );
      let searchBar = (
        <form>
            <div id = "search-bar-container">
              <input type= "text" value = {this.state.search}
                    placeholder = "Search specific foods by name"
                    onChange = {this.updateSearch.bind(this)}
               />
                <img src = {magni} alt = "Search bar"/>
             </div>
          </form>
      );

      display = (
        <CSSTransition
          in = {true}
          appear = {true}
          classNames = "fade"
          timeout = {1000}
        >
        <div id = "food-list-page">
          {background}
          <div id = "food-list-view">
            {searchBar}
            <div id = "section-focus">
              <CSSTransition
                classNames = "enter-above"
                in = {true}
                appear = {true}
                timeout = {1000}
              >
                {section}
              </CSSTransition>
              {focusSection}
            </div>
            <footer id = "search-disclaimer">
              <p>
                <strong>Note</strong> Nutrition can seem an obscure art. Horn of Plenty
                can help provide a starting point, and hopefully make the process less
                daunting. Ultimately you will have to find what
                works for you. Please be creative and experiment!
              </p>
              <p>
                <strong>Caution:</strong> Please be aware that what is considered a 'healthy'
                weight can have different connotations based on who you ask (a health professional,
                a body positive person, an athlete, your next door neighbor-- who incidentally
                has a very sensible middle-of-the-road outlook on controversial topics, what
                a good bloke).
                In general, extreme weight (both low and high) increases health risks
                in different ways. Please exercise common sense when setting your targets,
                best of luck!
              </p>
            </footer>
          </div>
        </div>
        </CSSTransition>
      );
    }


    return(
      <TransitionGroup
        id = "css-transitions"
      >
        <CSSTransition
          in = {true}
          appear = {true}
          classNames = {'fade'}
          timeout = {1000}
        >
          {display}
        </CSSTransition>
      </TransitionGroup>
    );
  }
}

export default FoodSearch;
