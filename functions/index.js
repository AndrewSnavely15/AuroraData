// Written by Maxfield Gordon, David Vasilia, Andrew Snavely, and Cliff Rawlings
// Last updated June 3, 2019

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const DialogflowApp = require('actions-on-google').DialogflowApp;
//const {Card, Suggestion} = require('dialogflow-fulfillment');
//const {Payload} = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements
admin.initializeApp();


const db = admin.firestore();

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  
  const BIGQUERY = require('@google-cloud/bigquery');

const BIGQUERY_CLIENT = new BIGQUERY({
  projectId: 'databot-231102' 
});


  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  /*Returns the number of students enrolled in a course. 
  	Parameters are given and necessary in order for this function to be called.
    The term, year, course prefix, and course number will be passed in and be 
    used to access the Firebase database and return the number enrolled.
    */	
  function students_enrolled(agent) {
	const [term, year, course_prefix, course_number, action] = [agent.parameters.term, agent.parameters.year, agent.parameters.course_prefix.toUpperCase(), agent.parameters.course_number, agent.parameters.action]; 
    const OPTIONS = {
			query: 'select ENROLLED from `databot-231102.Aurora_Test.CSUSB_Data` where Term = "' + term + '" and D_CRS_LAB = "' + course_prefix + course_number + '"'
    };
    return BIGQUERY_CLIENT
            .query(OPTIONS)
            .then(results => {
      			var enr_val = JSON.stringify(results[0][0].ENROLLED)
      			console.log(enr_val);
      			agent.add(`The number of students enrolled in ${course_prefix} ${course_number} is ${enr_val}.`);
      			//console.log(JSON.stringify(results));
      			//agent.add(`The number of students enrolled in ${course_prefix} ${course_number} is ${JSON.stringify(results)}.`);
    });
  }
   /*Returns the number of students repeated in a course. 
  	Parameters are given and necessary in order for this function to be called.
    The term, year, course prefix, and course number will be passed in and be 
    used to access the Firebase database and return the number repeated.
    */
   function students_repeated(agent) {
	const [term, year, course_prefix, course_number] = [agent.parameters.term, agent.parameters.year, agent.parameters.course_prefix.toUpperCase(), agent.parameters.course_number]; 
   const OPTIONS = {
			query: 'select ENROLLED_REPEATERS from `databot-231102.Aurora_Test.CSUSB_Data` where Term = "' + term + '" and D_CRS_LAB = "' + course_prefix + course_number + '"'
    };
    return BIGQUERY_CLIENT
            .query(OPTIONS)
            .then(results => {
      			var enr_val = JSON.stringify(results[0][0].ENROLLED_REPEATERS)
      console.log(enr_val);
	  agent.add(`The number of students that repeated ${course_prefix} ${course_number} is ${enr_val}.`);
      });
  }
  /*Returns the number of students enrolled for the first time in a course. 
  	Parameters are given and necessary in order for this function to be called.
    The term, year, course prefix, and course number will be passed in and be 
    used to access the Firebase database and return the number enrolled for the first time.
    */
  function first_time_enrolled(agent) {
	const [term, year, course_prefix, course_number] = [agent.parameters.term, agent.parameters.year, agent.parameters.course_prefix.toUpperCase(), agent.parameters.course_number]; 
   const OPTIONS = {
			query: 'select ENROLLED_FIRST_TIME from `databot-231102.Aurora_Test.CSUSB_Data` where Term = "' + term + '" and D_CRS_LAB = "' + course_prefix + course_number + '"'
    };
    return BIGQUERY_CLIENT
            .query(OPTIONS)
            .then(results => {
      			var enr_val = JSON.stringify(results[0][0].ENROLLED_FIRST_TIME)
      console.log(enr_val);
	  agent.add(`The number of students that are enrolled for the first time for ${course_prefix} ${course_number} is ${enr_val}.`);
      });
  }
  /* Returns the number of courses in a department. 
  	 Term and course prefix are necessary for accessing the number of 
     courses in the database.*/
  function num_of_courses(agent) {
    const [term, department] = [agent.parameters.term, agent.parameters.department];
   const OPTIONS = {
			query: 'select COUNT(ENROLLED) from `databot-231102.Aurora_Test.CSUSB_Data` where Term = "' + term + '" and DEPT_OF_COURSE = "' + department +  '"'
    };
    return BIGQUERY_CLIENT
            .query(OPTIONS)
            .then(results => {
      			var enr_val = JSON.stringify(results[0][0].COUNT(ENROLLED))
      console.log(enr_val);
      agent.add(`The number of ${course_prefix} courses are ${enr_val}`);
      });
  }
  /* Returns the number of students enrolled in the entire department.
  	 Parameters needed are the same as the students enrolled function.
     In the database, the Course number collection is accessed, and each document
     is counted since each document represents a course number.
    */
  function students_in_courses(agent) {
    const [term, year, course_prefix, course_number] = [agent.parameters.term, 
                                                        agent.parameters.year, 
                                                        agent.parameters.course_prefix.toUpperCase(), 
                                                        agent.parameters.course_number];
    
     var count = 0;
     return db.collection('Term').doc(term).collection('Course').doc(course_prefix).collection('Course_Num').get()
    .then( snapshot => 
    {
      snapshot.forEach(doc => 
      {
        var a = doc.data().Enrolled;
        count = count + a;
      });
       JSON.stringify(count);
      agent.add(`The number of students enrolled in ${course_prefix} courses are ${count}`);
    });
  }
  /* Returns the percentage of students that have repeated the same
  	 course based on the number enrolled in the course. The function accesses
     the enrolled and repeated document IDs to retrieve the data. Dividing
     the number of repeated by the number of enrolled will return the percentage.
     */
  function percent_of_students_for_course(agent)
  {
    const [term, year, course_prefix, course_number, action] = [agent.parameters.term, 
                                                        agent.parameters.year, 
                                                        agent.parameters.course_prefix.toUpperCase(), 
                                                        agent.parameters.course_number,
                                                        agent.parameters.action];
    
   const OPTIONS = {
			query: 'select PERCENT_REPEATERS from `databot-231102.Aurora_Test.CSUSB_Data` where Term = "' + term + '" and D_CRS_LAB = "' + course_prefix + course_number + '"'
    };
    return BIGQUERY_CLIENT
            .query(OPTIONS)
            .then(results => {
      			var enr_val = JSON.stringify(results[0][0].PERCENT_REPEATERS)
      			console.log(enr_val);
      agent.add(`The percentage of ${action} in 
			  ${course_prefix} ${course_number} is ${enr_val} percent`);
    });
  }
  /* Returns the number of GE courses in a department. Accesses the GE course ID
  	 in each of the documents and checking if the the value is equal to "Y" 
     would increase the count by one.
     */
  function num_of_GE_courses(agent) {
    const [term, course_prefix] = [agent.parameters.term, agent.parameters.course_prefix.toUpperCase()];
    var count = 0;
    return db.collection('Term').doc(term).collection('Course').doc(course_prefix).collection('Course_Num').get()
    .then( snapshot => {
      snapshot.forEach(doc => {
        if(doc.data().GE_Course == "Y")
        {
          count++;
        }
      });
      console.log(count);
      agent.add(`The number of GE ${course_prefix} offered in ${term} is ${count}`);
    });
  }
  
  function college(agent) {
	const [term, year, course_prefix, course_number] = [agent.parameters.term, agent.parameters.year, agent.parameters.course_prefix.toUpperCase(), agent.parameters.course_number]; 
    return db.collection('Term').doc(term).collection('Course').doc(course_prefix).collection('Course_Num').doc(course_number).get()
    .then( doc => {
      var value = JSON.stringify(doc.data().College);
      console.log(value);
	  agent.add(`${course_prefix} ${course_number} is apart of College of ${value} in ${term}.`);
      });
  }
  
  function course_level(agent) {
	const [term, year, course_prefix, course_number] = [agent.parameters.term, agent.parameters.year, agent.parameters.course_prefix.toUpperCase(), agent.parameters.course_number]; 
    return db.collection('Term').doc(term).collection('Course').doc(course_prefix).collection('Course_Num').doc(course_number).get()
    .then( doc => {
      var value = JSON.stringify(doc.data().Course_Level);
      console.log(value);
	  agent.add(`${course_prefix} ${course_number} is a ${value} course in ${term}.`);
      });
  }
  
  // Working progress...
  function highest_repeater_course(agent) {
    const [action] = [agent.parameters.action];
    var arr1 = {};
    var arr2 = [];
    var arr3 = [];
    var num = 0;
    
    var db1 = db.collection('Term');
    return db1.get()
    .then( snapshot => {
      snapshot.forEach(doc => {
       arr1.push(doc.id);
      }); 
      console.log(arr1);
    
    });
    
    /*
    for(var i = 0; i < arr1.size(); i++)
    {
    	db.collection('Term').doc(arr1[i]).collection('Course').get()
    	.then( snapshot => {
      	snapshot.forEach(doc => {
          arr2.push(doc.id);
          
        });
       });
    }
    for(var j = 0; j < arr2.size(); j++)
    {
      db.collection('Term').doc(arr1[i]).collection('Course').doc(arr2[j]).collection('Course_Num').get()
      .then( snapshot => {
      snapshot.forEach(doc => {
          arr3.push(doc.data().Repeaters);
       });
      });
    }
    for(var k = 0; k < arr3.size(); k++)
    {
      switch(k)
      {
        case 0:
           num = arr3[k];
          break;
        case k > 0:
          if(arr3[k] > arr3[k-1])
          {
            num = arr3[k];
          }
          else
          {
            num = arr3[k-1];
          }
          break;
      }
    }
     console.log(num);   
  return agent.add(`The course with the highest repeaters is ${course_prefix} ${course_number} with ${num} students`);
   */  
 }
  
 function num_of_term_courses(agent)
  {
    const term = agent.parameters.term;
    var courses = [];
     db.collection("Term").doc(term).collection("Course").get()
    .then( snapshot => {
      snapshot.forEach(doc => {
        var ID = doc.id;
        courses.push(ID);
      });
      console.log(courses);
      agent.add(`${JSON.stringify(courses[0])}`);
    });
    
    
  }
  let intentMap = new Map();
  intentMap.set('students_enrolled', students_enrolled);
  intentMap.set('students_repeated', students_repeated);
  intentMap.set('students in courses', students_in_courses);
  intentMap.set('First Time Enrolled', first_time_enrolled);
  intentMap.set('Number of courses', num_of_courses);
  intentMap.set('Highest repeated course', highest_repeater_course);
  intentMap.set('Number of term courses', num_of_term_courses);
  intentMap.set('Number of GE courses', num_of_GE_courses);
  intentMap.set('College', college);
  intentMap.set('Course Level', course_level);
  intentMap.set('percent in course', percent_of_students_for_course);
  intentMap.set('Default Welcome Intent', welcome);
  // intentMap.set('Default Fallback Intent', fallback);
  // intentMap.set('TermStart', termStart);
  agent.handleRequest(intentMap);
});
