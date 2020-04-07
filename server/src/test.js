var csv = require("csv");

var results = [
  {
    question:
      "How do I get international roaming services added to my account? ",
    answer:
      '<p>Wireless service is required to add International features. Certain eligibility rules and restrictions apply. Contact a sales representative or call Customer Care at 866.MOBILITY for details and assistance. To add online, go to <span class><a href="https://www.att.com/myatt" class="_1QRfu " aria-label="att.com/myatt" rel="noopener">att.com/myatt</a></span>, log in, and follow the steps to view wireless plans and international options. Certain eligibility rules and restrictions apply.</p>',
  },
  {
    question:
      "Are there any options specifically for travel to Mexico and Canada?",
    answer:
      '<p>AT&amp;T unlimited plan customers can talk, text, and use their plan data&#xA0;with an eligible device in Mexico or Canada for no roaming charge. Go to <span class><a href="http://www.att.com/roamna" target="_blank" class="_1QRfu " aria-label="att.com/roamna" rel="noopener">att.com/roamna</a></span> for details.</p>',
  },
  {
    question: "What do I do upon arrival abroad to make or receive calls? ",
    answer:
      "<p>If you have purchased an international roaming package or otherwise added international roaming service and turned on your wireless phone abroad, it will automatically search for a wireless network. When the name or network number of the local operator is displayed, your phone should be ready to use.<br><br>1. To call or send a message back to the U.S., simply dial <b>+</b>, followed by <b>1</b>, then the area code and number.<br>2. To call or send a text to another country, dial <b>+</b>, followed by the country code and local number.<br><br>With most devices, the + sign will appear if you press and hold the 0 key.</p>",
  },
  {
    question:
      "What is required for AT&T customers to roam internationally at LTE speeds?",
    answer:
      "<p>There are two requirements:<br><br>1. An LTE network must be commercially available to AT&amp;T customers roaming in the visited country.<br>2. Your device must be LTE-capable and compatible with the frequency (band) over which LTE is deployed on the foreign network. If LTE is not available or your LTE device does not support the LTE frequency band(s) required, you will automatically attach to a network with the next fastest data speed, typically 3G.</p>",
  },
  {
    question: "Can I use my wireless phone while on a cruise?",
    answer:
      '<p>Yes. AT&amp;T offers talk, text, and data service on more than 250 major cruise ships. Pay-per-use rates apply for usage while on board the ship. Discount packages are available for customers taking cruises on select ships. For a complete list of cruise ships and details, go to <span class><a href="https://www.att.com/cruiseships" class="_1QRfu " aria-label="att.com/cruiseships" rel="noopener">att.com/cruiseships</a></span>.</p>',
  },
  {
    question:
      "How do I place a call or send a text, picture, or video message back to the U.S. (or to someone with a U.S. number who is traveling with me)?",
    answer:
      "<p>Enter&#xA0;<b>+</b>&#xA0;then&#xA0;<b>1</b>, followed by the area code and the number you are contacting. With most devices, the&#xA0;<b>+</b>&#xA0;sign will appear if you press and hold the 0 key.&#xA0;For calls or messages to another country, dial&#xA0;<b>+</b>, followed by the country code and local number.</p>",
  },
];

csv.stringify(results, function (err, data) {
  console.log(data);
});

csv.stringify(
  results,
  {
    header: true,
  },
  function (err, data) {
    console.log(data);
  }
);

csv.stringify(
  results,
  {
    header: true,
    delimiter: "\t",
  },
  function (err, data) {
    console.log(data);
  }
);
