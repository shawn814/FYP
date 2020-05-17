<template>
     <div>
            <p> {{item.id}}</p>
            <p @click="toggle =! toggle">Details</p>
            <p v-if="toggle">{{ item.description}}</p>
            <p>{{ii}}</p>
            =======================================
        </div>
</template>
<script>
export default {
    name:"pp",
    props:['item'],
    data:function(){
        return{
            toggle:false,
        }
    }
}
</script>