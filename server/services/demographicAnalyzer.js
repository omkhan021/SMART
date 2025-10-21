const axios = require('axios');

class DemographicAnalyzer {
  constructor() {
    this.agifyApiKey = process.env.AGIFY_API_KEY;
    this.genderizeApiKey = process.env.GENDERIZE_API_KEY;
    this.hiveApiKey = process.env.HIVE_API_KEY;
  }

  /**
   * Analyze demographics for a single username
   * @param {string} username - Username to analyze
   * @param {string} profilePictureUrl - Optional profile picture URL
   * @param {string} bioText - Optional bio text
   * @returns {Object} - Demographic analysis results
   */
  async analyzeUserDemographics(username, profilePictureUrl = null, bioText = null) {
    try {
      const results = {
        username,
        predicted_age: null,
        age_confidence: 0,
        predicted_gender: null,
        gender_confidence: 0,
        predicted_location_country: null,
        predicted_location_state: null,
        predicted_location_city: null,
        location_confidence: 0,
        profile_picture_url: profilePictureUrl,
        bio_text: bioText
      };

      // Extract first name from username for age/gender prediction
      const firstName = this.extractFirstName(username);

      // Parallel API calls for age and gender prediction
      const [ageResult, genderResult] = await Promise.allSettled([
        this.predictAge(firstName),
        this.predictGender(firstName)
      ]);

      // Process age prediction result
      if (ageResult.status === 'fulfilled' && ageResult.value) {
        results.predicted_age = ageResult.value.age;
        results.age_confidence = ageResult.value.confidence || 0.5;
      }

      // Process gender prediction result
      if (genderResult.status === 'fulfilled' && genderResult.value) {
        results.predicted_gender = genderResult.value.gender;
        results.gender_confidence = genderResult.value.confidence || 0.5;
      }

      // Analyze location from bio text
      if (bioText) {
        const locationResult = await this.extractLocationFromBio(bioText);
        if (locationResult) {
          results.predicted_location_country = locationResult.country;
          results.predicted_location_state = locationResult.state;
          results.predicted_location_city = locationResult.city;
          results.location_confidence = locationResult.confidence;
        }
      }

      // If profile picture is available, use Hive AI for visual analysis
      if (profilePictureUrl && this.hiveApiKey) {
        const visualResult = await this.analyzeProfilePicture(profilePictureUrl);
        if (visualResult) {
          // Use visual analysis to enhance or override predictions
          if (visualResult.age && visualResult.age_confidence > results.age_confidence) {
            results.predicted_age = visualResult.age;
            results.age_confidence = visualResult.age_confidence;
          }
          if (visualResult.gender && visualResult.gender_confidence > results.gender_confidence) {
            results.predicted_gender = visualResult.gender;
            results.gender_confidence = visualResult.gender_confidence;
          }
        }
      }

      return results;

    } catch (error) {
      console.error('Demographic analysis error:', error);
      return {
        username,
        predicted_age: null,
        age_confidence: 0,
        predicted_gender: null,
        gender_confidence: 0,
        predicted_location_country: null,
        predicted_location_state: null,
        predicted_location_city: null,
        location_confidence: 0,
        profile_picture_url: profilePictureUrl,
        bio_text: bioText
      };
    }
  }

  /**
   * Analyze demographics for multiple users
   * @param {Array} users - Array of user objects with username, profilePictureUrl, bioText
   * @param {Function} progressCallback - Progress callback function
   * @returns {Array} - Array of demographic analysis results
   */
  async analyzeUsersDemographics(users, progressCallback = () => {}) {
    const results = [];
    const batchSize = 5; // Process 5 users at a time to avoid rate limits

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchPromises = batch.map(async (user) => {
        return await this.analyzeUserDemographics(
          user.username,
          user.profilePictureUrl,
          user.bioText
        );
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Update progress
      const progress = Math.round(((i + batchSize) / users.length) * 100);
      progressCallback(progress, `Analyzed ${Math.min(i + batchSize, users.length)} of ${users.length} users`);

      // Add delay between batches to respect rate limits
      if (i + batchSize < users.length) {
        await this.delay(2000);
      }
    }

    return results;
  }

  /**
   * Predict age from first name using Agify.io API
   * @param {string} firstName - First name
   * @returns {Object} - Age prediction result
   */
  async predictAge(firstName) {
    if (!firstName || !this.agifyApiKey) {
      return null;
    }

    try {
      const response = await axios.get('https://api.agify.io', {
        params: {
          name: firstName,
          api_key: this.agifyApiKey
        },
        timeout: 10000
      });

      if (response.data && response.data.age) {
        return {
          age: response.data.age,
          confidence: 0.7 // Agify doesn't provide confidence, use default
        };
      }

      return null;
    } catch (error) {
      console.error('Age prediction error:', error);
      return null;
    }
  }

  /**
   * Predict gender from first name using Genderize.io API
   * @param {string} firstName - First name
   * @returns {Object} - Gender prediction result
   */
  async predictGender(firstName) {
    if (!firstName || !this.genderizeApiKey) {
      return null;
    }

    try {
      const response = await axios.get('https://api.genderize.io', {
        params: {
          name: firstName,
          api_key: this.genderizeApiKey
        },
        timeout: 10000
      });

      if (response.data && response.data.gender) {
        return {
          gender: response.data.gender,
          confidence: response.data.probability || 0.5
        };
      }

      return null;
    } catch (error) {
      console.error('Gender prediction error:', error);
      return null;
    }
  }

  /**
   * Extract location information from bio text using NLP
   * @param {string} bioText - Bio text to analyze
   * @returns {Object} - Location extraction result
   */
  async extractLocationFromBio(bioText) {
    if (!bioText) {
      return null;
    }

    try {
      // Simple location extraction using common patterns
      const locationPatterns = {
        // Country patterns
        country: /(?:from|based in|located in|live in|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
        // State/Province patterns
        state: /(?:from|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,\s*([A-Z]{2})/gi,
        // City patterns
        city: /(?:from|in|live in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
      };

      const locations = {
        country: null,
        state: null,
        city: null,
        confidence: 0.3 // Low confidence for text-based extraction
      };

      // Extract country
      const countryMatch = bioText.match(locationPatterns.country);
      if (countryMatch) {
        locations.country = countryMatch[0].replace(/(?:from|based in|located in|live in|in)\s+/i, '').trim();
      }

      // Extract state
      const stateMatch = bioText.match(locationPatterns.state);
      if (stateMatch) {
        locations.state = stateMatch[0].replace(/(?:from|in)\s+/i, '').trim();
      }

      // Extract city
      const cityMatch = bioText.match(locationPatterns.city);
      if (cityMatch) {
        locations.city = cityMatch[0].replace(/(?:from|in|live in)\s+/i, '').trim();
      }

      // Return location if any was found
      if (locations.country || locations.state || locations.city) {
        return locations;
      }

      return null;
    } catch (error) {
      console.error('Location extraction error:', error);
      return null;
    }
  }

  /**
   * Analyze profile picture using Hive AI Demographic API
   * @param {string} profilePictureUrl - URL of the profile picture
   * @returns {Object} - Visual analysis result
   */
  async analyzeProfilePicture(profilePictureUrl) {
    if (!profilePictureUrl || !this.hiveApiKey) {
      return null;
    }

    try {
      const response = await axios.post('https://api.thehive.ai/api/v2/task/sync', {
        image_url: profilePictureUrl,
        models: ['demographics']
      }, {
        headers: {
          'Authorization': `Token ${this.hiveApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.data && response.data.status === 'completed') {
        const demographics = response.data.results[0]?.entities[0];
        if (demographics) {
          return {
            age: demographics.age,
            age_confidence: demographics.confidence,
            gender: demographics.gender,
            gender_confidence: demographics.confidence
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Profile picture analysis error:', error);
      return null;
    }
  }

  /**
   * Extract first name from username
   * @param {string} username - Username to extract first name from
   * @returns {string} - Extracted first name
   */
  extractFirstName(username) {
    if (!username) {
      return null;
    }

    // Remove common prefixes and suffixes
    let firstName = username
      .replace(/^@/, '') // Remove @ prefix
      .replace(/[._-]/g, ' ') // Replace separators with spaces
      .split(' ')[0] // Take first part
      .replace(/\d+/g, '') // Remove numbers
      .trim();

    // If the result is too short or contains only numbers, return null
    if (firstName.length < 2 || /^\d+$/.test(firstName)) {
      return null;
    }

    return firstName;
  }

  /**
   * Get demographic statistics from analyzed users
   * @param {Array} analyzedUsers - Array of users with demographic analysis
   * @returns {Object} - Demographic statistics
   */
  getDemographicStatistics(analyzedUsers) {
    const stats = {
      total: analyzedUsers.length,
      age: {
        distribution: {
          '13-17': 0,
          '18-24': 0,
          '25-34': 0,
          '35-44': 0,
          '45-54': 0,
          '55+': 0,
          'unknown': 0
        },
        average: 0,
        median: 0
      },
      gender: {
        male: 0,
        female: 0,
        'non-binary': 0,
        unknown: 0
      },
      location: {
        countries: {},
        states: {},
        cities: {}
      }
    };

    const ages = [];
    let totalAge = 0;
    let validAgeCount = 0;

    analyzedUsers.forEach(user => {
      // Age distribution
      if (user.predicted_age) {
        ages.push(user.predicted_age);
        totalAge += user.predicted_age;
        validAgeCount++;

        if (user.predicted_age >= 13 && user.predicted_age <= 17) {
          stats.age.distribution['13-17']++;
        } else if (user.predicted_age >= 18 && user.predicted_age <= 24) {
          stats.age.distribution['18-24']++;
        } else if (user.predicted_age >= 25 && user.predicted_age <= 34) {
          stats.age.distribution['25-34']++;
        } else if (user.predicted_age >= 35 && user.predicted_age <= 44) {
          stats.age.distribution['35-44']++;
        } else if (user.predicted_age >= 45 && user.predicted_age <= 54) {
          stats.age.distribution['45-54']++;
        } else if (user.predicted_age >= 55) {
          stats.age.distribution['55+']++;
        }
      } else {
        stats.age.distribution.unknown++;
      }

      // Gender distribution
      if (user.predicted_gender) {
        stats.gender[user.predicted_gender]++;
      } else {
        stats.gender.unknown++;
      }

      // Location distribution
      if (user.predicted_location_country) {
        stats.location.countries[user.predicted_location_country] = 
          (stats.location.countries[user.predicted_location_country] || 0) + 1;
      }
      if (user.predicted_location_state) {
        stats.location.states[user.predicted_location_state] = 
          (stats.location.states[user.predicted_location_state] || 0) + 1;
      }
      if (user.predicted_location_city) {
        stats.location.cities[user.predicted_location_city] = 
          (stats.location.cities[user.predicted_location_city] || 0) + 1;
      }
    });

    // Calculate average age
    stats.age.average = validAgeCount > 0 ? totalAge / validAgeCount : 0;

    // Calculate median age
    if (ages.length > 0) {
      ages.sort((a, b) => a - b);
      const middle = Math.floor(ages.length / 2);
      stats.age.median = ages.length % 2 === 0 
        ? (ages[middle - 1] + ages[middle]) / 2 
        : ages[middle];
    }

    // Calculate percentages
    stats.agePercentages = {};
    Object.keys(stats.age.distribution).forEach(ageGroup => {
      stats.agePercentages[ageGroup] = (stats.age.distribution[ageGroup] / stats.total) * 100;
    });

    stats.genderPercentages = {};
    Object.keys(stats.gender).forEach(gender => {
      stats.genderPercentages[gender] = (stats.gender[gender] / stats.total) * 100;
    });

    return stats;
  }

  /**
   * Utility function to add delay
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = DemographicAnalyzer;
