import React, { Component } from 'react';
import { database } from './firebase';
import StarRating from './StarRating';
import SelectionButtons from './SelectionButtons';
import { Button, Col, Row, FormGroup, FormControl, Image } from 'react-bootstrap';

const formStyles = {
  form: {
    border: '1px solid #606060',
    padding: '7px'
  },
  button: {
    backgroundColor: '#ec1928',
    color: '#ffffff',
    borderRadius: '0',
    border: 'none',
  },
  image: {
    width: '50px', 
    height: '50px',
    margin: '5px',
  },
  feedback: {
    textAlign: 'left',
  },
  input: {
    borderRadius: "0",
  },
};

class ReviewForm extends Component {
  constructor(props) {
    super(props);
     
    this.state = {
      rating: 0,
      comment: '',
      validation: null,
    };

    this.doWhopsRef = database.ref(`/proto/${this.props.eventId}/reviews`);

    this.getValidationState = this.getValidationState.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onStarClick = this.onStarClick.bind(this);
  }

  getValidationState(comment) {
    const length = comment.length;
    if (length >= 0 && length <= 10) {
      this.setState({ validation: null });
    }
    else if (length > 10 && length < 140) {
      this.setState({ validation: 'success' });
    } else {
      this.setState({ validation: 'error' });
    }
  }

  handleChange(e) {
    const comment = e.target.value;
    this.getValidationState(comment);
    this.setState({ comment });
  }

  onStarClick(newRating, prevRating, name) {
    this.setState({ rating: newRating });
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.state.rating && this.state.comment.length > 0) {
      this.commentSubmit();
      this.starSubmit();
      this.setState({
        rating: 0,
        comment: '',
        validation: null,
      });
    }
  }

  commentSubmit() {
    this.handleDatabaseSubmit('hasCommented', 'comments', this.state.comment);
  }

  starSubmit() {
    this.handleDatabaseSubmit('hasRated', 'ratings', this.state.rating);
  }

  handleDatabaseSubmit(hasCompleted, reviewType, reviewPart) {
    const user = this.props.user;
    const newReviewPart = reviewPart;
    const reviewSelected = this.props.reviewSelected;
    const reviewSelectedRef = this.doWhopsRef.child(reviewSelected);

    reviewSelectedRef.once('value').then(snapshot => {
      const userHasRated = snapshot.child(hasCompleted).child(user.uid).val();

      if (userHasRated) {
        const ratingKey = snapshot.child(hasCompleted).child(user.uid).child('key').val();
        reviewSelectedRef
          .child(reviewType)
          .child(ratingKey)
          .set(newReviewPart);
      } else {
        const key = reviewSelectedRef
          .child(reviewType)
          .push(newReviewPart).key;
        reviewSelectedRef
          .child(hasCompleted)
          .child(user.uid)
          .set({
            key: key,
            user: user.displayName,
            [user.uid]: true
          });
      }
    });
  }

  render() {
    const { comment, rating } = this.state;
    const { user, creatorName, handleButtonClick, reviewSelected } = this.props;

    return (
      <Row>
        <Col xs={12} sm={6}>
          <form style={formStyles.form} onSubmit={this.handleSubmit}>
            <FormGroup controlId="formReviews" validationState={this.state.validation}>
              <Row>
                <Col xs={4}>
                  <StarRating
                      name={reviewSelected}
                      starCount={5}
                      value={rating}
                      onStarClick={this.onStarClick}
                      starColor="#ec1928"
                      className="pull-left"
                    />
                </Col>
                <Col xs={8}>    
                  <SelectionButtons
                    user={user}
                    creatorName={creatorName}
                    reviewSelected={reviewSelected}
                    handleButtonClick={handleButtonClick}
                  />
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                <Image src={user.photoURL} alt={user.displayName} style={formStyles.image} circle />
                </Col>
              </Row>
              <Row>
                <Col xs={9} md={10}>
                  <FormControl
                    type="text"
                    value={comment}
                    placeholder="Comment..."
                    onChange={this.handleChange}
                    style={formStyles.input}
                  />
                  <FormControl.Feedback style={formStyles.feedback}/>
                  </Col>
                  <Col xs={3} md={2}>
                    <Button type="submit" style={formStyles.button} className="pull-right">Submit</Button>
                </Col>
              </Row>
            </FormGroup>
          </form>
        </Col>
      </Row>
    );
  }
}

export default ReviewForm;
